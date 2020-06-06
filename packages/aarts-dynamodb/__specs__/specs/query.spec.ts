import { Strippable, clearDynamo, queryForId } from "../testutils"
import { seedAirtoursData } from "./seed.test.data";

describe('query spec', () => {

  beforeAll(async (done) => {
    await clearDynamo();
    await seedAirtoursData()
    done()
  },30000)
  test ('test', () => {})

  // describe('query.table', () => {

  //   beforeAll(async (done) => { 
  //     await clearDynamo(); 
  //     await seedAirtoursData()
  //     done() 
  //   })
  
  //   test('query for all related to an item', async () => {
  //     // todo all refkeys
  //     // all history
      
  //   })
  
  //   test('query for all related to a deleted item', async () => {
  //     // todo no refkeys
  //     // all history
      
  //   })
    
  // })

  // describe('query.gsi1.meta__smetadata.spec', () => {
  //   test('query all items having particular string refkey value', async () => {


  //   })
  //   test('query all items having particular refkey begining with value', async () => {


  //   })
  // })

  // describe('query.gsi2.meta__nmetadata.spec', () => {
  //   test('query all items having particular number refkey value', async () => {


  //   })
  //   test('query all items having particular refkey greater than number value', async () => {


  //   })
  //   test('query all items having particular refkey lower than number value', async () => {


  //   })
  //   test('query all items having particular refkey between 2 number values', async () => {


  //   })
  // })

  // describe('query.gsi3.smetadata__meta.spec', () => {
  //   test('query particular item tepes having something in common with a string refkey value', async () => {

    
  //   })
  // })

  // describe('query.gsi4.nmetadata__meta.spec', () => {
  //   test('query particular item tepes having something in common with a number refkey value', async () => {

    
  //   })
  // })


})


