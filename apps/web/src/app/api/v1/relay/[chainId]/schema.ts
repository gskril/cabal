import { z } from 'zod'

/* 
{
    "to": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "value": "1000",
    "data": "0x",
    "chainId": "31337",
    "proof": {
        "merkleTreeDepth": "1",
        "merkleTreeRoot": "15072455385723004728391568434269917452175057560864330595979104241296826134229",
        "nullifier": "2432130996237736738922540632796572003532507629729510922653082317559646996809",
        "message": "71449365241074709419469110251443098840852445887414443790693493183138548466850",
        "scope": "15072455385723004728391568434269917452175057560864330595979104241296826134229",
        "points": [
            "10082539395460993945227192553075930100508716116137228739257368835107668955174",
            "21874329518966965217302373148366076300303084191794267688356202532475212099715",
            "3680969181725311038746941834387221051903733686814300140723063452866481210276",
            "15495033016412668925928800268419645107126789054361719249293365148798416760028",
            "1895309130967631350082715688031480016365832927156669288165775898275491802002",
            "11282804402855397579124242445779041193835121508448362287173509878987753562605",
            "14635423188485829860316619173274199718514106842931200029348121531203127470295",
            "9097188558659260734894144232002616995191505592454694265394268656263289559883"
        ]
    }
}
*/

const bigintRegex = z.string().regex(/^[0-9]+$/)

export const txSchema = z.object({
  target: z.string().startsWith('0x'),
  chainId: z.coerce.number(),
  function: z.string().startsWith('0x'),
  args: z.array(z.string()),
  // cabal: z.string().startsWith('0x'),
  // to: z.string().startsWith('0x'),
  // value: bigintRegex,
  // data: z.string().startsWith('0x'),
  // proof: z.object({
  //   merkleTreeDepth: bigintRegex,
  //   merkleTreeRoot: bigintRegex,
  //   nullifier: bigintRegex,
  //   message: bigintRegex,
  //   scope: bigintRegex,
  //   points: bigintRegex.array().length(8),
  // }),
})

export const querySchema = z.object({
  chainId: z.coerce.number(),
})

export type HealthcheckResponse =
  | {
      ready: true
      chainId: number
      message?: undefined
      error?: undefined
    }
  | {
      ready: false
      chainId?: undefined
      message: string
      error?: any
    }
