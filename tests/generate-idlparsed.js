const { assert } = require('chai');
const { generateIdlParsed } = require('../src/cli/generate-idlparsed');

describe('The parsed IDL generator', function () {
  it('leaves a spec without IDL intact', async () => {
    const spec = {};
    const result = await generateIdlParsed(spec);
    assert.deepEqual(result, {});
  });

  it('parses raw IDL defined in the `idl` property', async () => {
    const idl = 'interface foo {};';
    const spec = { idl };
    const result = await generateIdlParsed(spec);
    assert.equal(result?.idl?.idl, idl);
    assert.deepEqual(result?.idl?.idlNames, {
      foo: {
        extAttrs: [],
        fragment: 'interface foo {};',
        inheritance: null,
        members: [],
        name: 'foo',
        partial: false,
        type: 'interface'
      }
    });
  });

  it('parses raw IDL defined in the `idl.idl` property', async () => {
    const idl = 'interface foo {};';
    const spec = { idl: { idl } };
    const result = await generateIdlParsed(spec);
    assert.equal(result?.idl?.idl, idl);
    assert.deepEqual(result?.idl?.idlNames, {
      foo: {
        extAttrs: [],
        fragment: 'interface foo {};',
        inheritance: null,
        members: [],
        name: 'foo',
        partial: false,
        type: 'interface'
      }
    });
  });

  it('reports IDL parsing errors', async () => {
    const idl = 'intraface foo {};';
    const spec = { idl };
    const result = await generateIdlParsed(spec);
    assert.equal(result?.idl?.idl, idl);
    assert.equal(result.idl, `WebIDLParseError: Syntax error at line 1:
intraface foo {};
^ Unrecognised tokens`);
  });
});