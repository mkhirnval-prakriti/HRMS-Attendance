'use client'
import { useState, useRef } from 'react'
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Download, Loader2, Eye } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

interface UploadResult {
  total:number; inserted:number; duplicates:number; errors:number;
  errorDetails:string[]; duplicatePhones:string[];
}

interface Props { sources:{id:number;name:string}[] }

const REQUIRED_COLS = ['Phone']
const OPTIONAL_COLS = ['Name','Product','Qty','Price','Address','City','Pincode','Source','Remark']

export default function BulkUploadClient({ sources }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File|null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [defaultSource, setDefaultSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<UploadResult|null>(null)
  const [step, setStep] = useState<'select'|'preview'|'result'>('select')

  function handleFileChange(e:React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) { toast.error('Only Excel/CSV files supported'); return }
    setFile(f)
    // Preview
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = ev.target?.result
      const wb = XLSX.read(data, { type:'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows:any[] = XLSX.utils.sheet_to_json(ws, { defval:'' })
      if (rows.length===0) { toast.error('File is empty'); return }
      setHeaders(Object.keys(rows[0]))
      setPreview(rows.slice(0,5))
      setStep('preview')
    }
    reader.readAsBinaryString(f)
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setProgress(10)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (defaultSource) formData.append('defaultSourceId', defaultSource)
      setProgress(30)
      const res = await fetch('/api/orders/bulk-upload', { method:'POST', body:formData })
      setProgress(90)
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setResult(data.data)
      setStep('result')
      setProgress(100)
      toast.success(`Import complete! ${data.data.inserted} orders imported.`)
    } catch(e:any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Name','Phone','Product','Qty','Price','Address','City','Pincode','State','District','Source','Remark'],
      ['John Doe','9876543210','Product A','1','999','123 Main St','Delhi','110001','Delhi','Central','Store1','Sample']
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Orders')
    XLSX.writeFile(wb, 'upload-template.xlsx')
  }

  function downloadErrors(errors:string[]) {
    const ws = XLSX.utils.aoa_to_sheet([['Error'], ...errors.map(e=>[e])])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Errors')
    XLSX.writeFile(wb, 'upload-errors.xlsx')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/orders" className="btn-ghost btn-sm p-2"><ArrowLeft className="w-4 h-4"/></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bulk Upload Orders</h1>
          <p className="text-sm text-gray-500">Import orders from Excel/CSV file</p>
        </div>
        <button onClick={downloadTemplate} className="btn-secondary btn-sm ml-auto">
          <Download className="w-3.5 h-3.5"/>Download Template
        </button>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6">
        {['select','preview','result'].map((s,i)=>(
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step===s?'bg-green-600 text-white':step==='result'&&i<2||step==='preview'&&i<1?'bg-green-200 text-green-700':'bg-gray-200 text-gray-500'}`}>{i+1}</div>
            <span className="text-sm capitalize text-gray-600">{s==='select'?'Select File':s==='preview'?'Preview Data':'Results'}</span>
            {i<2 && <div className="w-8 h-0.5 bg-gray-200"/>}
          </div>
        ))}
      </div>

      {step==='select' && (
        <div className="card p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-8 h-8 text-green-600"/>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Select Excel or CSV File</h2>
            <p className="text-sm text-gray-500 mt-1">Max 50,000 rows. Duplicates auto-detected by phone number.</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-left">
            <p className="text-xs font-medium text-gray-700 mb-2">Required columns: {REQUIRED_COLS.join(', ')}</p>
            <p className="text-xs text-gray-500">Optional: {OPTIONAL_COLS.join(', ')}</p>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange}/>
          <button onClick={()=>fileRef.current?.click()} className="btn-primary mx-auto">
            <Upload className="w-4 h-4"/>Choose File
          </button>
        </div>
      )}

      {step==='preview' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-600"/>
                <div>
                  <p className="font-medium text-sm">{file?.name}</p>
                  <p className="text-xs text-gray-400">{((file?.size||0)/1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={()=>{setFile(null);setPreview([]);setStep('select')}} className="btn-ghost btn-sm">Change File</button>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Default Source:</label>
              <select className="input py-1.5 text-sm w-auto" value={defaultSource} onChange={e=>setDefaultSource(e.target.value)}>
                <option value="">Auto-detect from file</option>
                {sources.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-400"/>
              <span className="text-sm font-medium">Preview (first 5 rows)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>{headers.map(h=><th key={h} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.map((row,i)=>(
                    <tr key={i} className="hover:bg-gray-50">
                      {headers.map(h=><td key={h} className="px-3 py-2 text-gray-700 max-w-[120px] truncate whitespace-nowrap">{String(row[h]||'')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {loading && (
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="w-4 h-4 animate-spin text-green-600"/>
                <span className="text-sm font-medium">Importing... {progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{width:`${progress}%`}}/>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button onClick={()=>{setStep('select');setFile(null)}} className="btn-secondary">Back</button>
            <button onClick={handleUpload} disabled={loading} className="btn-primary">
              {loading?<><Loader2 className="w-4 h-4 animate-spin"/>Importing...</>:<><Upload className="w-4 h-4"/>Start Import</>}
            </button>
          </div>
        </div>
      )}

      {step==='result' && result && (
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4 text-lg">Import Complete</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{result.total}</p>
                <p className="text-xs text-blue-600 mt-1">Total Rows</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{result.inserted}</p>
                <p className="text-xs text-green-600 mt-1">Imported</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-yellow-700">{result.duplicates}</p>
                <p className="text-xs text-yellow-600 mt-1">Duplicates Skipped</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{result.errors}</p>
                <p className="text-xs text-red-600 mt-1">Errors</p>
              </div>
            </div>
          </div>
          {result.errorDetails.length>0 && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500"/><span className="font-medium text-sm">Errors</span></div>
                <button onClick={()=>downloadErrors(result.errorDetails)} className="btn-secondary btn-sm"><Download className="w-3.5 h-3.5"/>Download</button>
              </div>
              <ul className="space-y-1">{result.errorDetails.map((e,i)=><li key={i} className="text-xs text-red-600">{e}</li>)}</ul>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={()=>{setStep('select');setFile(null);setResult(null);setProgress(0)}} className="btn-secondary">Upload Another</button>
            <Link href="/orders" className="btn-primary">View Orders</Link>
          </div>
        </div>
      )}
    </div>
  )
}
