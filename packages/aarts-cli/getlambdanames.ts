const fs = require('fs')
const CloudFormation = require('yaml-cfn')

// Extract the AWS::Serverless::Function Resources as they
// are the entires we need to compile.
console.log("my CWD is " + __dirname)
const { Resources } = CloudFormation.yamlParse(fs.readFileSync('template.yml'))

const entries = Object.keys(Resources)
  .filter(key => Resources[key].Type == 'AWS::Lambda::Function')
  .filter(key => Resources[key].Properties.Runtime.startsWith('nodejs'))

  .reduce<Record<string,string>>((accum,key) => {
    const file = Resources[key].Properties.Handler.split('.')[1]
    accum[file] = key
    return accum
  },{})
console.log(entries[process.argv[2]])
module.exports = entries

