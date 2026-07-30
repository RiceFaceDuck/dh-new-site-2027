# Dependency Audit Report

## dh-backoffice-react

### Vulnerabilities
```
# npm audit report

@babel/core  <=7.29.0
@babel/core: Arbitrary File Read via sourceMappingURL Comment - https://github.com/advisories/GHSA-4x5r-pxfx-6jf8
fix available via `npm audit fix`
node_modules/@babel/core

@grpc/grpc-js  <=1.9.15
Severity: high
@grpc/grpc-js: A malformed request can cause a server crash - https://github.com/advisories/GHSA-5375-pq7m-f5r2
@grpc/grpc-js: An incoming malformed compressed message can cause a client or server crash - https://github.com/advisories/GHSA-99f4-grh7-6pcq
fix available via `npm audit fix`
node_modules/@grpc/grpc-js

esbuild  <=0.24.2
Severity: moderate
esbuild enables any website to send any requests to the development server and read the response - https://github.com/advisories/GHSA-67mh-4wv8-2f99
fix available via `npm audit fix --force`
Will install vite@8.1.3, which is a breaking change
node_modules/esbuild
  vite  <=6.4.2
  Depends on vulnerable versions of esbuild
  node_modules/vite

picomatch  <=2.3.1 || 4.0.0 - 4.0.3
Severity: high
Picomatch: Method Injection in POSIX Character Classes causes incorrect Glob Matching - https://github.com/advisories/GHSA-3v7f-55p6-f55p
Picomatch: Method Injection in POSIX Character Classes causes incorrect Glob Matching - https://github.com/advisories/GHSA-3v7f-55p6-f55p
Picomatch has a ReDoS vulnerability via extglob quantifiers - https://github.com/advisories/GHSA-c2c7-rcm5-vvqj
Picomatch has a ReDoS vulnerability via extglob quantifiers - https://github.com/advisories/GHSA-c2c7-rcm5-vvqj
fix available via `npm audit fix`
node_modules/picomatch
node_modules/tinyglobby/node_modules/picomatch

postcss  <8.5.10
Severity: moderate
PostCSS has XSS via Unescaped </style> in its CSS Stringify Output - https://github.com/advisories/GHSA-qx2v-qp2m-jg93
fix available via `npm audit fix`
node_modules/postcss

react-router  6.7.0 - 6.30.3
Severity: moderate
React Router's same-origin redirect with path starting // causes open redirect via protocol-relative URL reinterpretation - https://github.com/advisories/GHSA-2j2x-hqr9-3h42
fix available via `npm audit fix`
node_modules/react-router
  react-router-dom  6.6.3-pre.0 - 6.30.3
  Depends on vulnerable versions of react-router
  node_modules/react-router-dom

undici  <=6.26.0
Severity: high
Use of Insufficiently Random Values in undici - https://github.com/advisories/GHSA-c76h-2ccp-4975
Undici has an unbounded decompression chain in HTTP responses on Node.js Fetch API via Content-Encoding leads to resource exhaustion - https://github.com/advisories/GHSA-g9mf-h72j-4rw9
undici Denial of Service attack via bad certificate data - https://github.com/advisories/GHSA-cxrh-j4jr-qwg3
Undici: Malicious WebSocket 64-bit length overflows parser and crashes the client - https://github.com/advisories/GHSA-f269-vfmq-vjvj
Undici has an HTTP Request/Response Smuggling issue - https://github.com/advisories/GHSA-2mjp-6q6p-2qxm
Undici has Unbounded Memory Consumption in WebSocket permessage-deflate Decompression - https://github.com/advisories/GHSA-vrm6-8vpv-qv8q
Undici has Unhandled Exception in WebSocket Client Due to Invalid server_max_window_bits Validation - https://github.com/advisories/GHSA-v9p9-hfj2-hcw8
Undici has CRLF Injection in undici via `upgrade` option - https://github.com/advisories/GHSA-4992-7rv2-5pvq
undici vulnerable to HTTP header injection via Set-Cookie percent-decoding - https://github.com/advisories/GHSA-p88m-4jfj-68fv
undici WebSocket client vulnerable to denial of service via fragment count bypass - https://github.com/advisories/GHSA-vxpw-j846-p89q
undici vulnerable to HTTP response queue poisoning via keep-alive socket reuse - https://github.com/advisories/GHSA-35p6-xmwp-9g52
undici vulnerable to Set-Cookie SameSite attribute downgrade via permissive substring matching - https://github.com/advisories/GHSA-g8m3-5g58-fq7m
fix available via `npm audit fix --force`
Will install firebase@12.15.0, which is a breaking change
node_modules/undici
  @firebase/auth  1.7.7-20240813205648 - 1.7.7-canary.1ff9661af || 1.7.8-20240827161511 - 1.7.9
  Depends on vulnerable versions of undici
  node_modules/@firebase/auth-compat/node_modules/@firebase/auth
  node_modules/firebase/node_modules/@firebase/auth
    firebase  0.900.22 || 7.9.1-0 - 7.9.1-canary.0396117e || 8.10.0-20217172214 - 8.10.0-canary.f40c0db53 || 9.0.0-20217250818 - 9.0.0-canary.d0d3acb10 || 9.0.1-2021727231341 - 9.0.1-canary.e039e1472 || 9.0.2-2021891633 - 9.0.2-canary.ff9baf70c || 9.0.3-202181503543 - 9.1.0-canary.f7d8324a1 || 9.1.1-2021830195733 - 9.1.1-canary.e70de6201 || 9.1.2-20219523556 - 9.1.2-canary.fc1d36497 || 9.22.1-20230524195328 || 10.12.2-20240523185724 - 10.12.2-canary.872e6f63e || 10.13.0-20240813205648 - 10.13.0-canary.fa0ed08fb || 10.13.1-20240827161511 - 10.14.1 || 11.9.0-20250603144652 - 11.9.0-canary.5871fd656
    Depends on vulnerable versions of @firebase/auth
    Depends on vulnerable versions of @firebase/auth-compat
    Depends on vulnerable versions of @firebase/firestore
    Depends on vulnerable versions of @firebase/firestore-compat
    Depends on vulnerable versions of @firebase/functions
    Depends on vulnerable versions of @firebase/functions-compat
    Depends on vulnerable versions of @firebase/storage
    Depends on vulnerable versions of @firebase/storage-compat
    node_modules/firebase
  @firebase/auth-compat  0.5.12-20240813205648 - 0.5.12-canary.fa0ed08fb || 0.5.13-20240827161511 - 0.5.14
  Depends on vulnerable versions of @firebase/auth
  Depends on vulnerable versions of undici
  node_modules/@firebase/auth-compat
  @firebase/firestore  4.7.0-20240813205648 - 4.7.0-canary.fa0ed08fb || 4.7.1-20240827161511 - 4.7.3
  Depends on vulnerable versions of undici
  node_modules/@firebase/firestore
    @firebase/firestore-compat  <=0.0.900-exp.520ca39d0 || 0.3.25-20240130223218 - 0.3.25-20240131233318 || 0.3.30-20240424141009 - 0.3.30-dataconnect-preview.f2ddc3d7b || 0.3.35-20240813205648 - 0.3.35-canary.fa0ed08fb || 0.3.36-20240827161511 - 0.3.38
    Depends on vulnerable versions of @firebase/firestore
    node_modules/@firebase/firestore-compat
  @firebase/functions  0.11.7-20240827161511 - 0.11.8
  Depends on vulnerable versions of undici
  node_modules/@firebase/functions
    @firebase/functions-compat  0.3.13-20240827161511 - 0.3.14
    Depends on vulnerable versions of @firebase/functions
    node_modules/@firebase/functions-compat
  @firebase/storage  0.13.0-20240814182916 - 0.13.0-canary.fa0ed08fb || 0.13.1-20240827161511 - 0.13.2
  Depends on vulnerable versions of undici
  node_modules/@firebase/storage
    @firebase/storage-compat  <=0.0.900-exp.520ca39d0 || 0.1.4-202192711727 - 0.1.4-canary.f27fe4304 || 0.3.10-20240814182916 - 0.3.10-canary.fa0ed08fb || 0.3.11-20240827161511 - 0.3.12
    Depends on vulnerable versions of @firebase/storage
    node_modules/@firebase/storage-compat

uuid  <11.1.1
Severity: moderate
uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided - https://github.com/advisories/GHSA-w5hq-g745-h8pq
fix available via `npm audit fix --force`
Will install firebase-admin@10.3.0, which is a breaking change
node_modules/uuid
  gaxios  6.4.0 - 6.7.1
  Depends on vulnerable versions of uuid
  node_modules/gaxios
  teeny-request  3.9.1 - 9.0.0
  Depends on vulnerable versions of uuid
  node_modules/teeny-request
    @google-cloud/storage  2.2.0 - 2.5.0 || >=5.19.0
    Depends on vulnerable versions of retry-request
    Depends on vulnerable versions of teeny-request
    node_modules/@google-cloud/storage
      firebase-admin  7.0.0 - 8.2.0 || >=11.0.0
      Depends on vulnerable versions of @google-cloud/storage
      node_modules/firebase-admin
    retry-request  7.0.0 - 7.0.2
    Depends on vulnerable versions of teeny-request
    node_modules/retry-request


xlsx  *
Severity: high
Prototype Pollution in sheetJS - https://github.com/advisories/GHSA-4r6h-8v6p-xvw6
SheetJS Regular Expression Denial of Service (ReDoS) - https://github.com/advisories/GHSA-5pgg-2g8v-p4x9
No fix available
node_modules/xlsx

25 vulnerabilities (1 low, 19 moderate, 5 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues possible (including breaking changes), run:
  npm audit fix --force

Some issues need review, and may require choosing
a different dependency.

```

### Outdated
```
Package                         Current   Wanted   Latest  Location                                     Depended by
@tanstack/react-query-devtools  5.101.0  5.101.2  5.101.2  node_modules/@tanstack/react-query-devtools  dh-backoffice-react
@vitejs/plugin-react              4.7.0    4.7.0    6.0.3  node_modules/@vitejs/plugin-react            dh-backoffice-react
autoprefixer                    10.4.27   10.5.2   10.5.2  node_modules/autoprefixer                    dh-backoffice-react
firebase                        10.14.1  10.14.1  12.15.0  node_modules/firebase                        dh-backoffice-react
framer-motion                   12.42.0  12.42.2  12.42.2  node_modules/framer-motion                   dh-backoffice-react
lucide-react                    0.378.0  0.378.0   1.23.0  node_modules/lucide-react                    dh-backoffice-react
postcss                           8.5.8   8.5.16   8.5.16  node_modules/postcss                         dh-backoffice-react
react                            18.3.1   18.3.1   19.2.7  node_modules/react                           dh-backoffice-react
react-dom                        18.3.1   18.3.1   19.2.7  node_modules/react-dom                       dh-backoffice-react
react-router-dom                 6.30.3   6.30.4   7.18.1  node_modules/react-router-dom                dh-backoffice-react
tailwindcss                      3.4.19   3.4.19    4.3.2  node_modules/tailwindcss                     dh-backoffice-react
vite                             5.4.21   5.4.21    8.1.3  node_modules/vite                            dh-backoffice-react

```

### Unused Dependencies
```
Unused dependencies
* framer-motion
* html5-qrcode
Unused devDependencies
* autoprefixer
* postcss
* tailwindcss

```

## dh-frontend

### Vulnerabilities
```
# npm audit report

@babel/core  <=7.29.0
@babel/core: Arbitrary File Read via sourceMappingURL Comment - https://github.com/advisories/GHSA-4x5r-pxfx-6jf8
fix available via `npm audit fix`
node_modules/@babel/core

@grpc/grpc-js  <=1.9.15
Severity: high
@grpc/grpc-js: A malformed request can cause a server crash - https://github.com/advisories/GHSA-5375-pq7m-f5r2
@grpc/grpc-js: An incoming malformed compressed message can cause a client or server crash - https://github.com/advisories/GHSA-99f4-grh7-6pcq
fix available via `npm audit fix`
node_modules/@grpc/grpc-js

@protobufjs/utf8  <=1.1.0
Severity: moderate
protobufjs has overlong UTF-8 decoding - https://github.com/advisories/GHSA-q6x5-8v7m-xcrf
fix available via `npm audit fix`
node_modules/@protobufjs/utf8

brace-expansion  <1.1.13
Severity: moderate
brace-expansion: Zero-step sequence causes process hang and memory exhaustion - https://github.com/advisories/GHSA-f886-m6hf-6m8v
fix available via `npm audit fix`
node_modules/brace-expansion

flatted  <=3.4.1
Severity: high
Prototype Pollution via parse() in NodeJS flatted - https://github.com/advisories/GHSA-rf6f-7fwh-wjgh
fix available via `npm audit fix`
node_modules/flatted

js-yaml  4.0.0 - 4.1.1
Severity: moderate
JS-YAML: Quadratic-complexity DoS in merge key handling via repeated aliases - https://github.com/advisories/GHSA-h67p-54hq-rp68
fix available via `npm audit fix`
node_modules/js-yaml

picomatch  <=2.3.1
Severity: high
Picomatch: Method Injection in POSIX Character Classes causes incorrect Glob Matching - https://github.com/advisories/GHSA-3v7f-55p6-f55p
Picomatch has a ReDoS vulnerability via extglob quantifiers - https://github.com/advisories/GHSA-c2c7-rcm5-vvqj
fix available via `npm audit fix`
node_modules/anymatch/node_modules/picomatch
node_modules/micromatch/node_modules/picomatch
node_modules/readdirp/node_modules/picomatch

protobufjs  <=7.6.2
Severity: critical
Arbitrary code execution in protobufjs - https://github.com/advisories/GHSA-xq3m-2v4x-88gg
protobuf.js: Code injection through bytes field defaults in generated toObject code - https://github.com/advisories/GHSA-66ff-xgx4-vchm
protobuf.js: Denial of service from crafted field names in generated code - https://github.com/advisories/GHSA-2pr8-phx7-x9h3
protobuf.js: Prototype injection in generated message constructors - https://github.com/advisories/GHSA-fx83-v9x8-x52w
protobuf.js: Code generation gadget after prototype pollution - https://github.com/advisories/GHSA-75px-5xx7-5xc7
protobuf.js: Process-wide denial of service through unsafe option paths - https://github.com/advisories/GHSA-jvwf-75h9-cwgg
protobuf.js: Denial of service through unbounded protobuf recursion - https://github.com/advisories/GHSA-685m-2w69-288q
protobufjs has overlong UTF-8 decoding - https://github.com/advisories/GHSA-q6x5-8v7m-xcrf
protobufjs: Denial of Service via unbounded recursive JSON descriptor expansion - https://github.com/advisories/GHSA-jggg-4jg4-v7c6
protobufjs : Schema-derived names can shadow runtime-significant properties - https://github.com/advisories/GHSA-f38q-mgvj-vph7
protobufjs: Denial of service through unbounded Any expansion during JSON conversion - https://github.com/advisories/GHSA-wcpc-wj8m-hjx6
fix available via `npm audit fix`
node_modules/protobufjs

react-router  7.0.0 - 7.15.0
Severity: high
React Router's vendored turbo-stream v2 allows arbitrary constructor invocation via TYPE_ERROR deserialization leading to Unauth RCE - https://github.com/advisories/GHSA-49rj-9fvp-4h2h
React Router's same-origin redirect with path starting // causes open redirect via protocol-relative URL reinterpretation - https://github.com/advisories/GHSA-2j2x-hqr9-3h42
React Router vulnerable to XSS in unstable RSC redirect handling via javascript: redirect targets - https://github.com/advisories/GHSA-8646-j5j9-6r62
React Router has stored XSS via unescaped Location header in prerendered redirect HTML - https://github.com/advisories/GHSA-f22v-gfqf-p8f3
React Router vulnerable to DoS via unbounded path expansion in __manifest endpoint - https://github.com/advisories/GHSA-8x6r-g9mw-2r78
React Router vulnerable to Denial of Service via reflected user input in single-fetch - https://github.com/advisories/GHSA-rxv8-25v2-qmq8
React Router: Potential CSRF via PUT/PATCH/DELETE document requests - https://github.com/advisories/GHSA-84g9-w2xq-vcv6
fix available via `npm audit fix`
node_modules/react-router
  react-router-dom  7.0.0-pre.0 - 7.14.1
  Depends on vulnerable versions of react-router
  node_modules/react-router-dom

vite  8.0.0 - 8.0.15
Severity: high
launch-editor: NTLMv2 hash disclosure via UNC path handling on Windows - https://github.com/advisories/GHSA-v6wh-96g9-6wx3
vite: `server.fs.deny` bypass on Windows alternate paths - https://github.com/advisories/GHSA-fx2h-pf6j-xcff
fix available via `npm audit fix`
node_modules/vite

11 vulnerabilities (1 low, 3 moderate, 6 high, 1 critical)

To address all issues, run:
  npm audit fix

```

### Outdated
```
Package                      Current   Wanted   Latest  Location                                  Depended by
@eslint/js                    9.39.4   9.39.4   10.0.1  node_modules/@eslint/js                   dh-frontend
@tailwindcss/postcss           4.2.1    4.3.2    4.3.2  node_modules/@tailwindcss/postcss         dh-frontend
@types/react                 19.2.14  19.2.17  19.2.17  node_modules/@types/react                 dh-frontend
@vitejs/plugin-react           6.0.1    6.0.3    6.0.3  node_modules/@vitejs/plugin-react         dh-frontend
autoprefixer                 10.4.27   10.5.2   10.5.2  node_modules/autoprefixer                 dh-frontend
eslint                        9.39.4   9.39.4   10.6.0  node_modules/eslint                       dh-frontend
eslint-plugin-react-hooks      7.0.1    7.1.1    7.1.1  node_modules/eslint-plugin-react-hooks    dh-frontend
eslint-plugin-react-refresh    0.5.2    0.5.3    0.5.3  node_modules/eslint-plugin-react-refresh  dh-frontend
firebase                     12.10.0  12.15.0  12.15.0  node_modules/firebase                     dh-frontend
globals                       17.4.0   17.7.0   17.7.0  node_modules/globals                      dh-frontend
lucide-react                 0.577.0  0.577.0   1.23.0  node_modules/lucide-react                 dh-frontend
postcss                       8.5.14   8.5.16   8.5.16  node_modules/postcss                      dh-frontend
react                         19.2.4   19.2.7   19.2.7  node_modules/react                        dh-frontend
react-dom                     19.2.4   19.2.7   19.2.7  node_modules/react-dom                    dh-frontend
react-router-dom              7.13.1   7.18.1   7.18.1  node_modules/react-router-dom             dh-frontend
tailwindcss                   3.4.19   3.4.19    4.3.2  node_modules/tailwindcss                  dh-frontend
vite                          8.0.10    8.1.3    8.1.3  node_modules/vite                         dh-frontend

```

### Unused Dependencies
```
Unused devDependencies
* @tailwindcss/postcss
* @types/react
* @types/react-dom
* autoprefixer
* postcss
* tailwindcss

```

## dh-staff-app

### Vulnerabilities
```
# npm audit report

@babel/core  <=7.29.0
@babel/core: Arbitrary File Read via sourceMappingURL Comment - https://github.com/advisories/GHSA-4x5r-pxfx-6jf8
fix available via `npm audit fix`
node_modules/@babel/core

@grpc/grpc-js  <=1.9.15
Severity: high
@grpc/grpc-js: A malformed request can cause a server crash - https://github.com/advisories/GHSA-5375-pq7m-f5r2
@grpc/grpc-js: An incoming malformed compressed message can cause a client or server crash - https://github.com/advisories/GHSA-99f4-grh7-6pcq
fix available via `npm audit fix`
node_modules/@grpc/grpc-js

@protobufjs/utf8  <=1.1.0
Severity: moderate
protobufjs has overlong UTF-8 decoding - https://github.com/advisories/GHSA-q6x5-8v7m-xcrf
fix available via `npm audit fix`
node_modules/@protobufjs/utf8

esbuild  <=0.24.2
Severity: moderate
esbuild enables any website to send any requests to the development server and read the response - https://github.com/advisories/GHSA-67mh-4wv8-2f99
fix available via `npm audit fix --force`
Will install vite@8.1.3, which is a breaking change
node_modules/esbuild
  vite  <=6.4.2
  Depends on vulnerable versions of esbuild
  node_modules/vite

picomatch  <=2.3.1 || 4.0.0 - 4.0.3
Severity: high
Picomatch: Method Injection in POSIX Character Classes causes incorrect Glob Matching - https://github.com/advisories/GHSA-3v7f-55p6-f55p
Picomatch: Method Injection in POSIX Character Classes causes incorrect Glob Matching - https://github.com/advisories/GHSA-3v7f-55p6-f55p
Picomatch has a ReDoS vulnerability via extglob quantifiers - https://github.com/advisories/GHSA-c2c7-rcm5-vvqj
Picomatch has a ReDoS vulnerability via extglob quantifiers - https://github.com/advisories/GHSA-c2c7-rcm5-vvqj
fix available via `npm audit fix`
node_modules/picomatch
node_modules/tinyglobby/node_modules/picomatch

postcss  <8.5.10
Severity: moderate
PostCSS has XSS via Unescaped </style> in its CSS Stringify Output - https://github.com/advisories/GHSA-qx2v-qp2m-jg93
fix available via `npm audit fix`
node_modules/postcss

protobufjs  <=7.6.2
Severity: critical
Arbitrary code execution in protobufjs - https://github.com/advisories/GHSA-xq3m-2v4x-88gg
protobuf.js: Code injection through bytes field defaults in generated toObject code - https://github.com/advisories/GHSA-66ff-xgx4-vchm
protobuf.js: Denial of service from crafted field names in generated code - https://github.com/advisories/GHSA-2pr8-phx7-x9h3
protobuf.js: Prototype injection in generated message constructors - https://github.com/advisories/GHSA-fx83-v9x8-x52w
protobuf.js: Code generation gadget after prototype pollution - https://github.com/advisories/GHSA-75px-5xx7-5xc7
protobuf.js: Process-wide denial of service through unsafe option paths - https://github.com/advisories/GHSA-jvwf-75h9-cwgg
protobuf.js: Denial of service through unbounded protobuf recursion - https://github.com/advisories/GHSA-685m-2w69-288q
protobufjs has overlong UTF-8 decoding - https://github.com/advisories/GHSA-q6x5-8v7m-xcrf
protobufjs: Denial of Service via unbounded recursive JSON descriptor expansion - https://github.com/advisories/GHSA-jggg-4jg4-v7c6
protobufjs : Schema-derived names can shadow runtime-significant properties - https://github.com/advisories/GHSA-f38q-mgvj-vph7
protobufjs: Denial of service through unbounded Any expansion during JSON conversion - https://github.com/advisories/GHSA-wcpc-wj8m-hjx6
fix available via `npm audit fix`
node_modules/protobufjs

react-router  6.7.0 - 6.30.3
Severity: moderate
React Router's same-origin redirect with path starting // causes open redirect via protocol-relative URL reinterpretation - https://github.com/advisories/GHSA-2j2x-hqr9-3h42
fix available via `npm audit fix`
node_modules/react-router
  react-router-dom  6.6.3-pre.0 - 6.30.3
  Depends on vulnerable versions of react-router
  node_modules/react-router-dom

undici  <=6.26.0
Severity: high
Use of Insufficiently Random Values in undici - https://github.com/advisories/GHSA-c76h-2ccp-4975
Undici has an unbounded decompression chain in HTTP responses on Node.js Fetch API via Content-Encoding leads to resource exhaustion - https://github.com/advisories/GHSA-g9mf-h72j-4rw9
undici Denial of Service attack via bad certificate data - https://github.com/advisories/GHSA-cxrh-j4jr-qwg3
Undici: Malicious WebSocket 64-bit length overflows parser and crashes the client - https://github.com/advisories/GHSA-f269-vfmq-vjvj
Undici has an HTTP Request/Response Smuggling issue - https://github.com/advisories/GHSA-2mjp-6q6p-2qxm
Undici has Unbounded Memory Consumption in WebSocket permessage-deflate Decompression - https://github.com/advisories/GHSA-vrm6-8vpv-qv8q
Undici has Unhandled Exception in WebSocket Client Due to Invalid server_max_window_bits Validation - https://github.com/advisories/GHSA-v9p9-hfj2-hcw8
Undici has CRLF Injection in undici via `upgrade` option - https://github.com/advisories/GHSA-4992-7rv2-5pvq
undici vulnerable to HTTP header injection via Set-Cookie percent-decoding - https://github.com/advisories/GHSA-p88m-4jfj-68fv
undici WebSocket client vulnerable to denial of service via fragment count bypass - https://github.com/advisories/GHSA-vxpw-j846-p89q
undici vulnerable to HTTP response queue poisoning via keep-alive socket reuse - https://github.com/advisories/GHSA-35p6-xmwp-9g52
undici vulnerable to Set-Cookie SameSite attribute downgrade via permissive substring matching - https://github.com/advisories/GHSA-g8m3-5g58-fq7m
fix available via `npm audit fix`
node_modules/undici
  @firebase/auth  1.7.7-20240813205648 - 1.7.7-canary.1ff9661af || 1.7.8-20240827161511 - 1.7.9
  Depends on vulnerable versions of undici
  node_modules/@firebase/auth-compat/node_modules/@firebase/auth
  node_modules/firebase/node_modules/@firebase/auth
    firebase  0.900.22 || 7.9.1-0 - 7.9.1-canary.0396117e || 8.10.0-20217172214 - 8.10.0-canary.f40c0db53 || 9.0.0-20217250818 - 9.0.0-canary.d0d3acb10 || 9.0.1-2021727231341 - 9.0.1-canary.e039e1472 || 9.0.2-2021891633 - 9.0.2-canary.ff9baf70c || 9.0.3-202181503543 - 9.1.0-canary.f7d8324a1 || 9.1.1-2021830195733 - 9.1.1-canary.e70de6201 || 9.1.2-20219523556 - 9.1.2-canary.fc1d36497 || 9.22.1-20230524195328 || 10.12.2-20240523185724 - 10.12.2-canary.872e6f63e || 10.13.0-20240813205648 - 10.13.0-canary.fa0ed08fb || 10.13.1-20240827161511 - 10.14.1 || 11.9.0-20250603144652 - 11.9.0-canary.5871fd656
    Depends on vulnerable versions of @firebase/auth
    Depends on vulnerable versions of @firebase/auth-compat
    Depends on vulnerable versions of @firebase/firestore
    Depends on vulnerable versions of @firebase/firestore-compat
    Depends on vulnerable versions of @firebase/functions
    Depends on vulnerable versions of @firebase/functions-compat
    Depends on vulnerable versions of @firebase/storage
    Depends on vulnerable versions of @firebase/storage-compat
    node_modules/firebase
  @firebase/auth-compat  0.5.12-20240813205648 - 0.5.12-canary.fa0ed08fb || 0.5.13-20240827161511 - 0.5.14
  Depends on vulnerable versions of @firebase/auth
  Depends on vulnerable versions of undici
  node_modules/@firebase/auth-compat
  @firebase/firestore  4.7.0-20240813205648 - 4.7.0-canary.fa0ed08fb || 4.7.1-20240827161511 - 4.7.3
  Depends on vulnerable versions of undici
  node_modules/@firebase/firestore
    @firebase/firestore-compat  <=0.0.900-exp.520ca39d0 || 0.3.25-20240130223218 - 0.3.25-20240131233318 || 0.3.30-20240424141009 - 0.3.30-dataconnect-preview.f2ddc3d7b || 0.3.35-20240813205648 - 0.3.35-canary.fa0ed08fb || 0.3.36-20240827161511 - 0.3.38
    Depends on vulnerable versions of @firebase/firestore
    node_modules/@firebase/firestore-compat
  @firebase/functions  0.11.7-20240827161511 - 0.11.8
  Depends on vulnerable versions of undici
  node_modules/@firebase/functions
    @firebase/functions-compat  0.3.13-20240827161511 - 0.3.14
    Depends on vulnerable versions of @firebase/functions
    node_modules/@firebase/functions-compat
  @firebase/storage  0.13.0-20240814182916 - 0.13.0-canary.fa0ed08fb || 0.13.1-20240827161511 - 0.13.2
  Depends on vulnerable versions of undici
  node_modules/@firebase/storage
    @firebase/storage-compat  <=0.0.900-exp.520ca39d0 || 0.1.4-202192711727 - 0.1.4-canary.f27fe4304 || 0.3.10-20240814182916 - 0.3.10-canary.fa0ed08fb || 0.3.11-20240827161511 - 0.3.12
    Depends on vulnerable versions of @firebase/storage
    node_modules/@firebase/storage-compat


20 vulnerabilities (1 low, 14 moderate, 4 high, 1 critical)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

```

### Outdated
```
Package               Current   Wanted   Latest  Location                           Depended by
@vitejs/plugin-react    4.7.0    4.7.0    6.0.3  node_modules/@vitejs/plugin-react  dh-staff-app
autoprefixer          10.4.27   10.5.2   10.5.2  node_modules/autoprefixer          dh-staff-app
firebase              10.14.1  10.14.1  12.15.0  node_modules/firebase              dh-staff-app
lucide-react          0.378.0  0.378.0   1.23.0  node_modules/lucide-react          dh-staff-app
postcss                 8.5.8   8.5.16   8.5.16  node_modules/postcss               dh-staff-app
react                  18.3.1   18.3.1   19.2.7  node_modules/react                 dh-staff-app
react-dom              18.3.1   18.3.1   19.2.7  node_modules/react-dom             dh-staff-app
react-router-dom       6.30.3   6.30.4   7.18.1  node_modules/react-router-dom      dh-staff-app
tailwindcss            3.4.19   3.4.19    4.3.2  node_modules/tailwindcss           dh-staff-app
vite                   5.4.21   5.4.21    8.1.3  node_modules/vite                  dh-staff-app

```

### Unused Dependencies
```
Unused dependencies
* react-qr-code
Unused devDependencies
* autoprefixer
* postcss
* tailwindcss

```

## dh-shared

### Vulnerabilities
No vulnerabilities found (or minor).

### Outdated
None found.

### Unused Dependencies
```
No depcheck issue

```

