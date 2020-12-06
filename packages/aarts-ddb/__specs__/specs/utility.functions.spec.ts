import { transformGraphQLSelection } from "../../DynamoDbClient";
import { clearDynamo } from "../testutils";

describe('utility.functions', () => {
  beforeAll(async (done) => { await clearDynamo(); done() })

  const testGraphql1 = `{\n  __typename\n  id\n  item_state\n  meta\n  procedure\n  revisions\n  ringToken\n  ... on Airport {\n    __typename\n    name\n    airport_size\n    branch\n    code\n    country\n    Country {\n      name\n      currency\n      code\n    }\n    type\n  }\n  ... on Flight {\n    __typename\n    airplane\n    duration_hours\n    flight_code\n    from_airport\n    FromAirport {\n      __typename\n      id\n      meta\n      Country {\n        id\n        name\n        currency\n        code\n      }\n      airport_size\n    }\n    from_country\n    to_airport\n    to_country\n    tourist_season\n  }\n  ... on Tourist {\n    __typename\n    airplane\n    flight\n    fname\n    from_airport\n    from_country\n    id_card\n    lname\n    ticket_type\n    to_airport\n    to_country\n    tourist_season\n  }\n}`
  const testGraphql11 = `{
      __typename
        id
        item_state
          meta
          procedure
          revisions
          ringToken
          ... on Airport {
              __typename
              name
              airport_size
              branch
              code
              country
              Country {
                name
                currency
                code
            }
            type
        }
          ... on Flight {
              __typename
              airplane
              duration_hours
              flight_code
              from_airport
              FromAirport {
                __typename
                id
                meta
                Country {
                  id
                  name
                  currency
                  code
              }
              airport_size
          }
            from_country
            to_airport
            to_country
            tourist_season
        }
          ... on Tourist {
              __typename
              airplane
              flight
              fname
              from_airport
              from_country
              id_card
              lname
              ticket_type
              to_airport
              to_country
              tourist_season
          }
      }`

  const testGraphql2 = `{a,c,d ... on SomeItem{someitemProp1, someItemProp2, prop3} otherProp, Tourist{Country{name,currency} Airplane{Flight{ToAirport{Country{name}}}}}}`
  const testGraphql21 =
    `{
    a,
    c,
    d
    ...on SomeItem{
      someitemProp1,
      someItemProp2,
      prop3
    } 
    otherProp,
    Tourist{
      Country{
        name,
        currency
      } 
      Airplane
      {
        Flight{
          ToAirport{
            Country
            {
              name
          }
        }
      }
    }
  }
}`

  test('transformGraphQLQuery deals with bad formatting', () => {
    const peersQuerInput1 = transformGraphQLSelection(testGraphql1)
    const peersQuerInput11 = transformGraphQLSelection(testGraphql11)
    expect(peersQuerInput1).toEqual(peersQuerInput11)
    expect(peersQuerInput1.loadPeersLevel).toBe(2)
    expect(peersQuerInput1.peersPropsToLoad).toStrictEqual(["Country", "FromAirport"])

    const peersQuerInput2 = transformGraphQLSelection(testGraphql2)
    const peersQuerInput21 = transformGraphQLSelection(testGraphql21)
    expect(peersQuerInput2).toEqual(peersQuerInput21)
    expect(peersQuerInput2.loadPeersLevel).toBe(5)
    expect(peersQuerInput2.peersPropsToLoad).toStrictEqual(["Tourist", "Country","Airplane","Flight","ToAirport"])

    expect(peersQuerInput2).toEqual(peersQuerInput21)
  })

  test('transformGraphQLQuery deals with FIRST LEVEL fragments - if nested fragments it may not calc correctly', () => {
    const transformed = transformGraphQLSelection(
      `{aaa
        ...on Airplane
        {
          A{
            bbb
          }
        }ccc
      }`)
    expect(transformed.loadPeersLevel).toEqual(1)
    expect(transformed.peersPropsToLoad).toEqual(["A"])
    expect(transformed.projectionExpression).toEqual("__typename,aaa,bbb,ccc,a")  // ensure ids loadPeers appended at the end (in this case A)
  })

  test('transformGraphQLQuery takes the most nested selection for loadPeersLevel', () => {
    const transformed = transformGraphQLSelection(
      `{aaa
        ...on Airplane
        {
          A{
            bbb
          }
          B{
            C{
              xxx
            }
          }
          D{
            E{
              F{
                G{
                  mostNested
                }
              }
            }
          }
        }ccc
      }`)
    expect(transformed.loadPeersLevel).toEqual(4)
    expect(transformed.peersPropsToLoad).toEqual(["A","B","C","D","E","F","G"])
    expect(transformed.projectionExpression).toEqual("__typename,aaa,bbb,xxx,mostNested,ccc,a,b,c,d,e,f,g") // ensure ids loadPeers appended at the end (om this case: A B C D E F G)
  })
})