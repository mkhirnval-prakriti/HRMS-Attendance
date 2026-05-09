import { db } from './index'
import { states, districts, sources } from './schema'

async function seed() {
  console.log('Seeding database...')

  // States
  const stateData = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
    'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
    'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
    'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
    'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh',
    'Jammu & Kashmir','Ladakh','Puducherry','Dadra & Nagar Haveli','Lakshadweep','Andaman & Nicobar'
  ]
  await db.insert(states).values(stateData.map(name => ({ name }))).onConflictDoNothing()
  console.log('✅ States seeded')

  // Sources
  const sourceData = ['Store1','Store2','IND','Delhi','Facebook','Google','WhatsApp','Instagram','Referral','Walk-in']
  await db.insert(sources).values(sourceData.map(name => ({ name }))).onConflictDoNothing()
  console.log('✅ Sources seeded')

  // Sample districts for Punjab
  const punjabState = await db.query.states.findFirst({ where: (s, { eq }) => eq(s.name, 'Punjab') })
  if (punjabState) {
    const districtData = ['Amritsar','Ludhiana','Jalandhar','Patiala','Bathinda','Mohali','Gurdaspur','Hoshiarpur','Firozpur','Faridkot']
    await db.insert(districts).values(districtData.map(name => ({ name, stateId: punjabState.id }))).onConflictDoNothing()
    console.log('✅ Districts seeded')
  }

  console.log('🎉 Seeding complete!')
  process.exit(0)
}

seed().catch(console.error)
