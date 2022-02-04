/**
 * Setup a proxy server that intercepts some network requests. To be used in
 * tests not to hit the network.
 *
 * @module nock-server
 */

const nock = require("nock");
const path = require("path");
const { existsSync } = require('fs');

/**
 * Determine the path to the "node_modules" folder. The path depends on whether
 * Reffy is run directly, or installed as a library.
 *
 * @function
 * @return {String} Path to the node_modules folder.
 */
function getModulesFolder() {
    const rootFolder = path.resolve(__dirname, '../..');
    let folder = path.resolve(rootFolder, 'node_modules');
    if (existsSync(folder)) {
        return folder;
    }
    folder = path.resolve(rootFolder, '..');
    return folder;
}
const modulesFolder = getModulesFolder();

const mockSpecs = {
  "/woff/woff2/": {
    html: `
      <title>WOFF2</title>
      <body>
        <dfn id='foo'>Foo</dfn>
        <a href="https://www.w3.org/TR/bar/#baz">bar</a>
        <ul class='toc'><li><a href='page.html'>page</a></ul>`,
    pages: {
      "page.html": `<h2 id='bar'>Heading in subpage</h2>`
    }
  },
  "/mediacapture-output/": `
    <script>respecConfig = { shortName: 'test' };</script>
    <script src='https://www.w3.org/Tools/respec/respec-w3c'></script>
    <div id=abstract></div>
    <pre class='idl'>[Exposed=Window] interface Foo { attribute DOMString bar; };</pre>`,
  "/accelerometer/": `<html>
    <h2>Normative references</h2>
    <dl>
      <dt>FOO</dt>
      <dd><a href='https://www.w3.org/TR/Foo'>Foo</a></dd>
    </dl>`,
  "/pointerlock/": `<html>
    <h1>Pointer Lock 2.0`
};

nock.disableNetConnect();
// for chrome devtool protocol
nock.enableNetConnect('127.0.0.1');

Object.keys(mockSpecs).forEach(path => {
  nock("https://w3c.github.io")
    .persist()
    .get(path)
    .reply(200,
      typeof mockSpecs[path] === "string" ? mockSpecs[path] : mockSpecs[path].html,
      { 'Content-Type': 'text/html' }
    );

  Object.keys(mockSpecs[path].pages || {}).forEach(page => {
    nock("https://w3c.github.io")
      .persist()
      .get(path + page)
      .reply(200,
        mockSpecs[path].pages[page],
        { 'Content-Type': 'text/html' });

  });
});


// Handling requests generated by ReSpec documents
nock("https://api.specref.org")
  .persist()
  .get("/bibrefs?refs=webidl,html").reply(200,
    { webidl: { href: "https://webidl.spec.whatwg.org/" } },
    { "Access-Control-Allow-Origin": "*" }
  );

nock("https://www.w3.org")
  .persist()
  .get("/scripts/TR/2021/fixup.js").reply(200, '')
  .get("/StyleSheets/TR/2021/logos/W3C").reply(200, '')
  .get("/StyleSheets/TR/2021/base.css").reply(200, '')
  .get("/Tools/respec/respec-highlight").replyWithFile(200,
    path.join(modulesFolder, "respec-hljs", "dist", "respec-highlight.js"),
    { "Content-Type": "application/js" })
  .get("/Tools/respec/respec-w3c").replyWithFile(200,
    path.join(modulesFolder, "respec", "builds", "respec-w3c.js"),
    { "Content-Type": "application/js" })
  .get("/TR/idontexist/").reply(404, '')
  .get("/TR/ididnotchange/").reply(function() {
    if (this.req.headers['if-modified-since'][0] === "Fri, 11 Feb 2022 00:00:42 GMT") {
      return [304, ''];
    } else {
      return [200, 'Unexpected path'];
    }
  });

nock("https://drafts.csswg.org")
  .persist()
  .get("/server-hiccup/").reply(200,
    `<html><title>Server hiccup</title>
    <h1> Index of Server Hiccup Module Level 42 </h1>`,
    { 'Content-Type': 'text/html' });

nock.emitter.on('error', function (err) {
  console.error(err);
});
nock.emitter.on('no match', function(req, options, requestBody) {
  // 127.0.0.1 is used by the devtool protocol, we ignore it
  if (req && req.hostname !== '127.0.0.1') {
    console.error("No match for nock request on " + (options ? options.href : req.href));
  }
});

module.exports = nock;
