        const app = document.getElementById('app');
        const floatingTimerEl = document.getElementById('floatingTimer');
        let audioCtx = null;

        function getAudioContext() {
            if (!audioCtx) audioCtx = new(window.AudioContext || window.webkitAudioContext)();
            return audioCtx;
        }

        function playBeep(freq = 880, dur = 0.15) {
            try {
                const ctx = getAudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + dur);
            } catch (e) {}
        }
        const globalTimer = { running: false, remaining: 0, total: 0, interval: null, beepInterval: null, expired: false,
            startTime: 0, pausedRemaining: 0 };

        function stopBeeping() { if (globalTimer.beepInterval) { clearInterval(globalTimer.beepInterval);
                globalTimer.beepInterval = null; } }

        function startBeeping() { stopBeeping();
            playBeep();
            globalTimer.beepInterval = setInterval(playBeep, 1000); }

        function updateGlobalTimerDisplay() {
            if (!globalTimer.running) return;
            const now = performance.now();
            const newRemaining = globalTimer.pausedRemaining - (now - globalTimer.startTime);
            if (newRemaining <= 0) {
                globalTimer.remaining = 0;
                globalTimer.running = false;
                globalTimer.expired = true;
                clearInterval(globalTimer.interval);
                globalTimer.interval = null;
                startBeeping();
                updateFloatingTimer();
                if (document.getElementById('tmDisplay')) {
                    document.getElementById('tmDisplay').textContent = '00:00:00';
                    document.getElementById('tmStart').textContent = '? Start';
                    document.getElementById('tmPause').disabled = true;
                }
                return;
            }
            globalTimer.remaining = newRemaining;
            if (floatingTimerEl.style.display !== 'none') {
                floatingTimerEl.textContent = '? ' + formatTimeMS(newRemaining);
                floatingTimerEl.classList.remove('expired');
            }
            if (document.getElementById('tmDisplay')) document.getElementById('tmDisplay').textContent = formatTimeMS(
                newRemaining);
        }

        function startGlobalTimer(durationMs) {
            stopGlobalTimer(false);
            globalTimer.total = durationMs;
            globalTimer.remaining = durationMs;
            globalTimer.pausedRemaining = durationMs;
            globalTimer.running = true;
            globalTimer.expired = false;
            globalTimer.startTime = performance.now();
            stopBeeping();
            globalTimer.interval = setInterval(updateGlobalTimerDisplay, 200);
            updateFloatingTimer();
        }

        function pauseGlobalTimer() {
            if (!globalTimer.running) return;
            const now = performance.now();
            globalTimer.pausedRemaining = globalTimer.remaining - (now - globalTimer.startTime);
            if (globalTimer.pausedRemaining < 0) globalTimer.pausedRemaining = 0;
            globalTimer.running = false;
            globalTimer.remaining = globalTimer.pausedRemaining;
            clearInterval(globalTimer.interval);
            globalTimer.interval = null;
            stopBeeping();
            updateFloatingTimer();
        }

        function resumeGlobalTimer() {
            if (globalTimer.running || globalTimer.expired || globalTimer.remaining <= 0) return;
            globalTimer.running = true;
            globalTimer.startTime = performance.now();
            globalTimer.pausedRemaining = globalTimer.remaining;
            stopBeeping();
            globalTimer.interval = setInterval(updateGlobalTimerDisplay, 200);
            updateFloatingTimer();
        }

        function stopGlobalTimer(reset = true) {
            globalTimer.running = false;
            clearInterval(globalTimer.interval);
            globalTimer.interval = null;
            stopBeeping();
            if (reset) { globalTimer.remaining = 0;
                globalTimer.total = 0;
                globalTimer.expired = false;
                globalTimer.pausedRemaining = 0; }
            updateFloatingTimer();
        }

        function formatTimeMS(ms) {
            if (ms < 0) ms = 0;
            const totalSec = Math.ceil(ms / 1000);
            const hrs = Math.floor(totalSec / 3600),
                mins = Math.floor((totalSec % 3600) / 60),
                secs = totalSec % 60;
            return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        }

        function updateFloatingTimer() {
            const currentViewIsTimer = document.getElementById('tmDisplay') !== null;
            if (globalTimer.running || globalTimer.expired) {
                if (!currentViewIsTimer) {
                    floatingTimerEl.style.display = 'block';
                    const timeStr = globalTimer.expired ? '00:00:00' : formatTimeMS(globalTimer.remaining);
                    floatingTimerEl.textContent = (globalTimer.expired ? '?? ' : '? ') + timeStr;
                    floatingTimerEl.classList.toggle('expired', globalTimer.expired);
                } else { floatingTimerEl.style.display = 'none'; }
            } else { floatingTimerEl.style.display = 'none'; }
        }
        floatingTimerEl.addEventListener('click', () => { renderTool('utilities', 'stopwatch');
            updateFloatingTimer(); });

        const categories = [
            { id: 'text', icon: '??', name: 'Text & Encode', desc: 'Encode, decode, generate text' },
            { id: 'design', icon: '??', name: 'CSS & Design',
            desc: 'Gradients, shadows, colors, flexbox, grid, glass, filters' },
            { id: 'code', icon: '??', name: 'Code Tools',
            desc: 'JSON, minifiers, regex, diff, JWT, SQL, YAML, snippets' },
            { id: 'security', icon: '??', name: 'Security', desc: 'Passwords, hashing, certificates, bcrypt' },
            { id: 'qrbarcode', icon: '??', name: 'QR & Barcode', desc: 'Generate/read QR, barcodes, vCard, WiFi' },
            { id: 'prompt', icon: '??', name: 'Prompt Tools', desc: 'AI prompt generator, creator & library' },
            { id: 'network', icon: '??', name: 'Network Tools', desc: 'DNS, WHOIS, HTTP status, URL parser' },
            { id: 'utilities', icon: '??', name: 'Utilities',
            desc: 'Stopwatch, notes, TTS, converters, calculators, pomodoro' },
            { id: 'data', icon: '??', name: 'Data Tools', desc: 'JSON?CSV, XML?JSON, Markdown table' }
        ];

        const tools = {
            text: [
                { id: 'base64', emoji: '??', title: 'Base64 Encoder/Decoder' }, { id: 'urlencode', emoji: '??',
                    title: 'URL Encoder/Decoder' }, { id: 'htmlentity', emoji: '??',
                title: 'HTML Entity Encoder' }, { id: 'wordcounter', emoji: '??',
                title: 'Word & Character Counter' }, { id: 'lorem', emoji: '??',
                title: 'Lorem Ipsum Generator' }, { id: 'uuid', emoji: '??', title: 'UUID Generator' }, { id: 'markdown',
                    emoji: '??', title: 'Markdown Previewer' }, { id: 'rot13', emoji: '??',
                title: 'ROT13 Cipher' }, { id: 'unicodeseq', emoji: '??',
                title: 'Unicode Escape/Unescape' }, { id: 'csv2json', emoji: '??',
                title: 'CSV to JSON Converter' }, { id: 'hexencode', emoji: '??',
                title: 'Hex Encoder/Decoder' }, { id: 'binarytext', emoji: '0??', title: 'Binary ? Text' },
                { id: 'morsecode', emoji: '??', title: 'Morse Code Converter' }, { id: 'slugify', emoji: '??',
                    title: 'URL Slug Generator' }, { id: 'findreplace', emoji: '??',
                title: 'Find & Replace' }, { id: 'linesort', emoji: '??', title: 'Text Line Sorter' }, { id: 'dedupe',
                    emoji: '??', title: 'Duplicate Line Remover' }, { id: 'asciitable', emoji: '??',
                title: 'ASCII Reference Table' }
            ],
            design: [
                { id: 'gradient', emoji: '??', title: 'Gradient Generator' }, { id: 'boxshadow', emoji: '??',
                    title: 'Box Shadow Generator' }, { id: 'colorpicker', emoji: '??',
                title: 'Color Picker & Convert' }, { id: 'contrast', emoji: '???',
                title: 'Contrast Checker' }, { id: 'flexbox', emoji: '??',
                title: 'Flexbox Playground' }, { id: 'colorplate', emoji: '??', title: 'Colour Plate' },
                { id: 'textformat', emoji: '??', title: 'Text Format Chooser' }, { id: 'cssgrid', emoji: '??',
                    title: 'CSS Grid Generator' }, { id: 'glassmorphism', emoji: '??',
                title: 'Glassmorphism Generator' }, { id: 'animgen', emoji: '?',
                title: 'CSS Animation Generator' }, { id: 'colorfromimage', emoji: '???',
                title: 'Color Palette from Image' }, { id: 'borderradius', emoji: '?',
                title: 'Border Radius Generator' }, { id: 'textshadow', emoji: '??',
                title: 'Text Shadow Generator' }, { id: 'cssfilter', emoji: '??',
                title: 'CSS Filter Playground' }, { id: 'cubicbezier', emoji: '??',
                title: 'Cubic Bezier Visualizer' }, { id: 'clippath', emoji: '??',
                title: 'Clip Path Generator' }, { id: 'cssunits', emoji: '??', title: 'CSS Unit Converter' },
                { id: 'svgshape', emoji: '??', title: 'SVG Shape Generator' }
            ],
            code: [
                { id: 'jsonfmt', emoji: '??', title: 'JSON Formatter' }, { id: 'cssmin', emoji: '???',
                    title: 'CSS Minifier' }, { id: 'jsmin', emoji: '?', title: 'JavaScript Minifier' }, { id: 'regex',
                    emoji: '??', title: 'Regex Tester' }, { id: 'diff', emoji: '??',
                title: 'Code Diff Checker' }, { id: 'jwt', emoji: '??', title: 'JWT Decoder' }, { id: 'sqlfmt',
                    emoji: '???', title: 'SQL Formatter' }, { id: 'html2jsx', emoji: '??',
                title: 'HTML to JSX' }, { id: 'metatags', emoji: '???', title: 'Meta Tag Generator' },
                { id: 'yaml2json', emoji: '??', title: 'YAML to JSON Converter' }, { id: 'snippet', emoji: '??',
                    title: 'Code Snippet Generator' }, { id: 'htmlfmt', emoji: '??',
                title: 'HTML Formatter' }, { id: 'xmlfmt', emoji: '??', title: 'XML Formatter' }, { id: 'jsbeautify',
                    emoji: '?', title: 'JS Beautifier' }, { id: 'cssbeautify', emoji: '??',
                title: 'CSS Beautifier' }, { id: 'unicodelookup', emoji: '??',
                title: 'Unicode Character Lookup' }, { id: 'gitignore', emoji: '??',
                title: '.gitignore Generator' }, { id: 'licensegen', emoji: '??',
                title: 'License Generator' }, { id: 'htmlentitiesref', emoji: '??',
                title: 'HTML Entities Reference' }
            ],
            security: [
                { id: 'password', emoji: '??', title: 'Password Generator' }, { id: 'hash', emoji: '#??',
                    title: 'Hash Generator' }, { id: 'certdecode', emoji: '??',
                title: 'Certificate Decoder' }, { id: 'rsainfo', emoji: '??',
                title: 'RSA Key Info Generator' }, { id: 'sslcheck', emoji: '??',
                title: 'SSL Certificate Checker' }, { id: 'securityheaders', emoji: '???',
                title: 'Security Headers Check' }, { id: 'bcryptgen', emoji: '??', title: 'Bcrypt Hash Generator' }
            ],
            qrbarcode: [
                { id: 'qrgenerator', emoji: '??', title: 'QR Code Generator' }, { id: 'qrreader', emoji: '??',
                    title: 'QR Code Reader' }, { id: 'barcodemaker', emoji: '??',
                title: 'Barcode Maker' }, { id: 'barcodereader', emoji: '??',
                title: 'Barcode Reader' }, { id: 'vcardqr', emoji: '??', title: 'vCard QR Generator' },
                { id: 'wifiqr', emoji: '??', title: 'WiFi QR Generator' }
            ],
            prompt: [
                { id: 'promptgenerator', emoji: '?', title: 'Prompt Generator' }, { id: 'promptcreator', emoji: '???',
                    title: 'Prompt Creator' }, { id: 'promptlibrary', emoji: '??',
                title: 'Prompt Library' }, { id: 'chattemplate', emoji: '??', title: 'Chat Template Builder' }
            ],
            network: [
                { id: 'httpstatus', emoji: '??', title: 'HTTP Status Codes' }, { id: 'dnslookup', emoji: '??',
                    title: 'DNS Lookup' }, { id: 'whoislookup', emoji: '???',
                title: 'WHOIS Lookup' }, { id: 'urlparser', emoji: '??', title: 'URL Parser' }, { id: 'useragent',
                    emoji: '???', title: 'User Agent Parser' }
            ],
            utilities: [
                { id: 'speedtest', emoji: '??', title: 'Internet Speed Checker' }, { id: 'stopwatch', emoji: '??',
                    title: 'Stopwatch & Timer' }, { id: 'notes', emoji: '??', title: 'Notes' }, { id: 'tts', emoji: '??',
                    title: 'Text to Speech' }, { id: 'unitconverter', emoji: '??',
                title: 'Unit Converter' }, { id: 'timestamp', emoji: '??',
                title: 'Timestamp Converter' }, { id: 'baseconv', emoji: '??',
                title: 'Number Base Converter' }, { id: 'cronparser', emoji: '?',
                title: 'Cron Expression Parser' }, { id: 'pomodoro', emoji: '??',
                title: 'Pomodoro Timer' }, { id: 'ipinfo', emoji: '??', title: 'IP Address Info' }, { id: 'currency',
                    emoji: '??', title: 'Currency Converter' }, { id: 'imagecompress', emoji: '???',
                title: 'Image Compressor' }, { id: 'agecalc', emoji: '??',
                title: 'Age Calculator' }, { id: 'bmicalc', emoji: '??', title: 'BMI Calculator' }, { id: 'randomnum',
                    emoji: '??', title: 'Random Number Generator' }, { id: 'coinflip', emoji: '??',
                title: 'Coin Flipper' }, { id: 'diceroller', emoji: '??', title: 'Dice Roller' }, { id: 'percentcalc',
                    emoji: '??', title: 'Percentage Calculator' }, { id: 'loancalc', emoji: '??',
                title: 'Loan EMI Calculator' }, { id: 'timezoneconv', emoji: '??', title: 'Timezone Converter' }
            ],
            data: [
                { id: 'json2csv', emoji: '??', title: 'JSON to CSV' }, { id: 'xml2json', emoji: '??',
                    title: 'XML to JSON' }, { id: 'mdtable', emoji: '??', title: 'Markdown Table Generator' }
            ]
        };

        function showToast(msg) {
            const t = document.createElement('div');
            t.className = 'toast';
            t.textContent = msg;
            document.getElementById('toastContainer').appendChild(t);
            setTimeout(() => t.remove(), 2500);
        }

        function copyText(text) {
            if (!text || text.trim() === '') { showToast('?? Nothing to copy'); return; }
            navigator.clipboard.writeText(text).then(() => showToast('? Copied!'));
        }

        function renderHome() {
            app.innerHTML =
                `<h1 style="font-size:2.5rem;text-shadow:0 0 20px var(--neon-cyan);">? DevToolKit Pro</h1>
        <p style="color:#aaa;margin-bottom:30px;">100 professional developer utilities</p>
        <div class="category-grid">${categories.map(c=>`<div class="cat-card" data-cat="${c.id}"><div class="icon">${c.icon}</div><h2>${c.name}</h2><p>${c.desc}</p></div>`).join('')}</div>`;
            document.querySelectorAll('.cat-card').forEach(card => card.addEventListener('click', () => renderCategory(card
                .dataset.cat)));
        }

        function renderCategory(catId) {
            const cat = categories.find(c => c.id === catId);
            app.innerHTML =
                `<button class="back-btn" id="backHomeBtn">?? Back to Categories</button>
        <h2 style="font-size:1.8rem;text-shadow:0 0 12px var(--neon-magenta);">${cat.icon} ${cat.name}</h2>
        <div class="tool-grid">${tools[catId].map(t=>`<div class="tool-item" data-tool="${t.id}"><div class="emoji">${t.emoji}</div><h3>${t.title}</h3></div>`).join('')}</div>`;
            document.getElementById('backHomeBtn').addEventListener('click', renderHome);
            document.querySelectorAll('.tool-item').forEach(item => item.addEventListener('click', () => renderTool(catId,
                item.dataset.tool)));
        }

        function renderTool(catId, toolId) {
            const cat = categories.find(c => c.id === catId);
            const tool = tools[catId].find(t => t.id === toolId);
            app.innerHTML =
                `<button class="back-btn" id="backCatBtn">? Back to ${cat.name}</button>
        <h2 style="font-size:1.5rem;text-shadow:0 0 10px var(--neon-lime);">${tool.emoji} ${tool.title}</h2>
        <div class="detail-card" id="toolContainer"></div>`;
            document.getElementById('backCatBtn').addEventListener('click', () => renderCategory(catId));
            loadTool(toolId);
        }

        function loadTool(toolId) {
            const container = document.getElementById('toolContainer');
            const toolMap = {
                speedtest: speedTestTool,
                stopwatch: stopwatchTimerTool,
                notes: notesTool,
                tts: ttsTool,
                unitconverter: unitConverterTool,
                base64: base64Tool,
                urlencode: urlEncodeTool,
                htmlentity: htmlEntityTool,
                wordcounter: wordCounterTool,
                lorem: loremTool,
                uuid: uuidTool,
                markdown: markdownTool,
                rot13: rot13Tool,
                gradient: gradientTool,
                boxshadow: boxShadowTool,
                colorpicker: colorPickerTool,
                contrast: contrastTool,
                flexbox: flexboxTool,
                colorplate: colorPlateTool,
                textformat: textFormatTool,
                jsonfmt: jsonFmtTool,
                cssmin: cssMinTool,
                jsmin: jsMinTool,
                regex: regexTool,
                diff: diffTool,
                jwt: jwtTool,
                sqlfmt: sqlFmtTool,
                html2jsx: html2jsxTool,
                metatags: metatagsTool,
                password: passwordTool,
                hash: hashTool,
                qrgenerator: qrGeneratorTool,
                qrreader: qrReaderTool,
                barcodemaker: barcodeMakerTool,
                barcodereader: barcodeReaderTool,
                promptgenerator: promptGeneratorTool,
                promptcreator: promptCreatorTool,
                timestamp: timestampTool,
                baseconv: baseConvTool,
                cronparser: cronParserTool,
                unicodeseq: unicodeEscapeTool,
                csv2json: csv2jsonTool,
                cssgrid: cssGridTool,
                glassmorphism: glassmorphismTool,
                animgen: animGenTool,
                colorfromimage: colorFromImageTool,
                yaml2json: yaml2jsonTool,
                snippet: snippetTool,
                certdecode: certDecodeTool,
                pomodoro: pomodoroTool,
                ipinfo: ipInfoTool,
                currency: currencyTool,
                imagecompress: imageCompressTool,
                hexencode: hexEncodeTool,
                binarytext: binaryTextTool,
                morsecode: morseCodeTool,
                slugify: slugifyTool,
                findreplace: findReplaceTool,
                linesort: lineSortTool,
                dedupe: dedupeTool,
                asciitable: asciiTableTool,
                borderradius: borderRadiusTool,
                textshadow: textShadowTool,
                cssfilter: cssFilterTool,
                cubicbezier: cubicBezierTool,
                clippath: clipPathTool,
                cssunits: cssUnitsTool,
                svgshape: svgShapeTool,
                htmlfmt: htmlFmtTool,
                xmlfmt: xmlFmtTool,
                jsbeautify: jsBeautifyTool,
                cssbeautify: cssBeautifyTool,
                unicodelookup: unicodeLookupTool,
                gitignore: gitignoreTool,
                licensegen: licenseGenTool,
                htmlentitiesref: htmlEntitiesRefTool,
                rsainfo: rsaInfoTool,
                sslcheck: sslCheckTool,
                securityheaders: securityHeadersTool,
                bcryptgen: bcryptGenTool,
                vcardqr: vcardQrTool,
                wifiqr: wifiQrTool,
                promptlibrary: promptLibraryTool,
                chattemplate: chatTemplateTool,
                httpstatus: httpStatusTool,
                dnslookup: dnsLookupTool,
                whoislookup: whoisLookupTool,
                urlparser: urlParserTool,
                useragent: userAgentTool,
                agecalc: ageCalcTool,
                bmicalc: bmiCalcTool,
                randomnum: randomNumTool,
                coinflip: coinFlipTool,
                diceroller: diceRollerTool,
                percentcalc: percentCalcTool,
                loancalc: loanCalcTool,
                timezoneconv: timezoneConvTool,
                json2csv: json2csvTool,
                xml2json: xml2jsonTool,
                mdtable: mdTableTool
            };
            if (toolMap[toolId]) { toolMap[toolId](container); } else { container.innerHTML =
                    `<p style="text-align:center;color:#888;padding:40px;">?? Tool "${toolId}" coming soon...</p>`; }
        }

        // === ALL EXISTING TOOLS (unchanged) ===
        function gradientTool(c) {
            c.innerHTML =
                `<div class="gradient-preview" id="gradPreview" style="background:linear-gradient(135deg,#ff00ff,#00ffff);"></div>
        <div class="row"><div><label>Color 1</label><input type="color" id="gradColor1" value="#ff00ff"></div><div><label>Color 2</label><input type="color" id="gradColor2" value="#00ffff"></div></div>
        <div class="row"><div><label>Direction</label><select id="gradDir"><option value="135deg">Diagonal</option><option value="to right">L to R</option><option value="to bottom">T to B</option></select></div></div>
        <label>CSS</label><div class="output-box" id="gradCSS"></div><button class="outline-btn" id="gradCopy">?? Copy</button>`;
            const preview = c.querySelector('#gradPreview'),
                color1 = c.querySelector('#gradColor1'),
                color2 = c.querySelector('#gradColor2'),
                dir = c.querySelector('#gradDir'),
                cssOut = c.querySelector('#gradCSS'),
                copyBtn = c.querySelector('#gradCopy');
            const update = () => { const gv = `linear-gradient(${dir.value}, ${color1.value}, ${color2.value})`;
                preview.style.background = gv;
                cssOut.textContent = `background: ${gv};`; };
            [color1, color2, dir].forEach(el => el.addEventListener('input', update));
            copyBtn.addEventListener('click', () => copyText(cssOut.textContent));
            update();
        }

        function boxShadowTool(c) {
            c.innerHTML = `<div class="shadow-preview" id="shadowPreview"></div>
        <div class="row"><div><label>X</label><input type="range" id="shX" min="-30" max="30" value="5"></div><div><label>Y</label><input type="range" id="shY" min="-30" max="30" value="5"></div></div>
        <div class="row"><div><label>Blur</label><input type="range" id="shBlur" min="0" max="50" value="15"></div><div><label>Spread</label><input type="range" id="shSpread" min="-20" max="20" value="0"></div></div>
        <div class="row"><div><label>Color</label><input type="color" id="shColor" value="#000000"></div></div>
        <label>CSS</label><div class="output-box" id="shCSS"></div><button class="outline-btn" id="shCopy">?? Copy</button>`;
            const preview = c.querySelector('#shadowPreview'),
                x = c.querySelector('#shX'),
                y = c.querySelector('#shY'),
                blur = c.querySelector('#shBlur'),
                spread = c.querySelector('#shSpread'),
                color = c.querySelector('#shColor'),
                cssOut = c.querySelector('#shCSS'),
                copyBtn = c.querySelector('#shCopy');
            const update = () => { const sv =
                    `${x.value}px ${y.value}px ${blur.value}px ${spread.value}px ${color.value}`;
                preview.style.boxShadow = sv;
                cssOut.textContent = `box-shadow: ${sv};`; };
            [x, y, blur, spread, color].forEach(el => el.addEventListener('input', update));
            copyBtn.addEventListener('click', () => copyText(cssOut.textContent));
            update();
        }

        function htmlEntityTool(c) {
            c.innerHTML =
                `<label>Input</label><textarea id="heInput" placeholder="Enter text with HTML entities..."><div class="test">Hello &amp; Welcome</div></textarea>
        <div class="row"><button id="heEncode">?? Encode</button><button id="heDecode" class="outline-btn">?? Decode</button><button id="heCopy" class="outline-btn">?? Copy Output</button></div>
        <label>Output</label><div class="output-box" id="heOutput"></div>`;
            const inp = c.querySelector('#heInput'),
                out = c.querySelector('#heOutput');
            c.querySelector('#heEncode').addEventListener('click', () => { const div = document.createElement('div');
                div.textContent = inp.value;
                out.textContent = div.innerHTML;
                showToast('?? Encoded'); });
            c.querySelector('#heDecode').addEventListener('click', () => { const div = document.createElement('div');
                div.innerHTML = inp.value;
                out.textContent = div.textContent;
                showToast('?? Decoded'); });
            c.querySelector('#heCopy').addEventListener('click', () => copyText(out.textContent));
            c.querySelector('#heEncode').click();
        }

        function markdownTool(c) {
            c.innerHTML =
                `<div class="row"><div style="flex:1;min-width:250px;"><label>Markdown Input</label><textarea id="mdInput" style="min-height:280px;"># Hello Markdown\n**bold** *italic*\n- List\n\`code\`\n> quote\n[Link](https://example.com)</textarea></div><div style="flex:1;min-width:250px;"><label>Preview</label><div class="md-preview" id="mdPreview"></div></div></div>
        <button class="outline-btn" id="mdCopy">?? Copy HTML</button>`;
            const inp = c.querySelector('#mdInput'),
                preview = c.querySelector('#mdPreview');

            function renderMD(text) {
                let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
                html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
                html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
                html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
                html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
                html = html.replace(/`{3}(\w*)\n?([\s\S]*?)`{3}/g, '<pre><code>$2</code></pre>');
                html = html.replace(/`(.+?)`/g, '<code>$1</code>');
                html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
                html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
                html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
                html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
                html = html.replace(/^---$/gm, '<hr>');
                html = html.replace(/\n\n/g, '</p><p>');
                html = '<p>' + html + '</p>';
                html = html.replace(/<p><h/g, '<h').replace(/<\/h(\d)><\/p>/g, '</h$1>');
                html = html.replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>');
                html = html.replace(/<p><blockquote>/g, '<blockquote>').replace(/<\/blockquote><\/p>/g,
                '</blockquote>');
                html = html.replace(/<p><pre>/g, '<pre>').replace(/<\/pre><\/p>/g, '</pre>');
                html = html.replace(/<p><hr><\/p>/g, '<hr>');
                html = html.replace(/<p>\s*<\/p>/g, '');
                return html;
            }
            inp.addEventListener('input', () => { preview.innerHTML = renderMD(inp.value); });
            c.querySelector('#mdCopy').addEventListener('click', () => copyText(preview.innerHTML));
            preview.innerHTML = renderMD(inp.value);
        }

        function rot13Tool(c) {
            c.innerHTML = `<label>Input</label><textarea id="rotInput">Hello World!</textarea>
        <div class="row"><button id="rotApply">?? Apply ROT13</button><button id="rotCopy" class="outline-btn">?? Copy</button></div>
        <label>Output</label><div class="output-box" id="rotOutput"></div>`;
            const inp = c.querySelector('#rotInput'),
                out = c.querySelector('#rotOutput');

            function rot13(str) { return str.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c
                    .charCodeAt(0) + 13) ? c : c - 26)); }
            c.querySelector('#rotApply').addEventListener('click', () => { out.textContent = rot13(inp.value);
                showToast('?? ROT13 applied'); });
            c.querySelector('#rotCopy').addEventListener('click', () => copyText(out.textContent));
            c.querySelector('#rotApply').click();
        }

        function jwtTool(c) {
            c.innerHTML =
                `<label>Paste JWT Token</label><textarea id="jwtInput" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."></textarea>
        <button id="jwtDecode">?? Decode JWT</button><div id="jwtOutput"></div><button class="outline-btn" id="jwtCopy">?? Copy Payload</button>`;
            c.querySelector('#jwtDecode').addEventListener('click', () => {
                const token = c.querySelector('#jwtInput').value.trim();
                const parts = token.split('.');
                const container = c.querySelector('#jwtOutput');
                if (parts.length !== 3) { container.innerHTML =
                    '<p style="color:#ff073a;">Invalid JWT format.</p>'; return; }
                try {
                    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
                    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                    container.innerHTML =
                        `<div class="speed-metric"><div class="lbl">Header</div><div class="output-box">${JSON.stringify(header,null,2)}</div></div><div class="speed-metric"><div class="lbl">Payload</div><div class="output-box" id="jwtPayloadBox">${JSON.stringify(payload,null,2)}</div></div>`;
                    if (payload.exp) {
                        const expDate = new Date(payload.exp * 1000);
                        container.innerHTML +=
                            `<p style="text-align:center;color:${expDate<new Date()?'#ff073a':'var(--neon-lime)'};">${expDate<new Date()?'? Expired':'? Valid until'} ${expDate.toLocaleString()}</p>`;
                    }
                    showToast('?? JWT decoded');
                } catch (e) { container.innerHTML = '<p style="color:#ff073a;">Error: ' + e.message + '</p>'; }
            });
            c.querySelector('#jwtCopy').addEventListener('click', () => { const pb = c.querySelector('#jwtPayloadBox');
                copyText(pb ? pb.textContent : ''); });
        }

        function sqlFmtTool(c) {
            c.innerHTML =
                `<label>Paste SQL</label><textarea id="sqlInput" style="min-height:130px;">select id,name,email from users where active=1 order by name desc limit 10</textarea>
        <button id="sqlFormat">??? Format SQL</button><label>Output</label><div class="output-box" id="sqlOutput"></div>
        <div class="row"><span id="sqlStats"></span><button class="outline-btn" id="sqlCopy">?? Copy</button></div>`;
            const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET',
                'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
                'INNER JOIN', 'ON', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'IN', 'NOT', 'NULL',
                'ASC', 'DESC', 'UNION', 'WITH'
            ];
            c.querySelector('#sqlFormat').addEventListener('click', () => {
                let sql = c.querySelector('#sqlInput').value.trim();
                if (!sql) return;
                const orig = sql.length;
                sql = sql.replace(/\s+/g, ' ');
                keywords.forEach(kw => { const rx = new RegExp('\\b(' + kw.replace(/ /g, '\\s+') + ')\\b', 'gi');
                    sql = sql.replace(rx, kw); });
                ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO',
                    'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
                    'UNION', 'WITH'
                ].forEach(cl => { sql = sql.replace(new RegExp('\\b(' + cl.replace(/ /g, '\\s+') + ')\\b',
                        'gi'), '\n$1'); });
                sql = sql.replace(/\n\s*\n/g, '\n').replace(/\n/g, '\n  ').trim();
                c.querySelector('#sqlOutput').textContent = sql;
                c.querySelector('#sqlStats').textContent =
                    `Original: ${orig} ? Formatted: ${sql.length} chars`;
                showToast('??? SQL formatted');
            });
            c.querySelector('#sqlCopy').addEventListener('click', () => copyText(c.querySelector('#sqlOutput')
            .textContent));
            c.querySelector('#sqlFormat').click();
        }

        function html2jsxTool(c) {
            c.innerHTML =
                `<label>Paste HTML</label><textarea id="h2jInput" style="min-height:130px;"><div class="container" onclick="handleClick()"><br><img src="pic.jpg"></div></textarea>
        <button id="h2jConvert">?? Convert to JSX</button><label>JSX Output</label><div class="output-box" id="h2jOutput"></div><button class="outline-btn" id="h2jCopy">?? Copy JSX</button>`;
            c.querySelector('#h2jConvert').addEventListener('click', () => {
                let html = c.querySelector('#h2jInput').value;
                html = html.replace(/class=/g, 'className=');
                html = html.replace(/for=/g, 'htmlFor=');
                html = html.replace(/tabindex=/g, 'tabIndex=');
                html = html.replace(/onclick=/g, 'onClick=');
                html = html.replace(/onchange=/g, 'onChange=');
                html = html.replace(/<br\s*\/?>/gi, '<br />');
                html = html.replace(/<img\s+([^>]*?)(?<!\\)>/gi, '<img $1 />');
                html = html.replace(/<input\s+([^>]*?)(?<!\\)>/gi, '<input $1 />');
                html = html.replace(/<!--/g, '{/* ');
                html = html.replace(/-->/g, ' */}');
                c.querySelector('#h2jOutput').textContent = html;
                showToast('?? Converted to JSX');
            });
            c.querySelector('#h2jCopy').addEventListener('click', () => copyText(c.querySelector('#h2jOutput')
            .textContent));
            c.querySelector('#h2jConvert').click();
        }

        function metatagsTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Title</label><input id="mtTitle" value="My Website"></div><div><label>Description</label><input id="mtDesc" value="A great website."></div></div>
        <button id="mtGenerate">??? Generate Meta Tags</button><div class="output-box" id="mtOutput" style="min-height:120px;"></div><button class="outline-btn" id="mtCopy">?? Copy</button>`;
            c.querySelector('#mtGenerate').addEventListener('click', () => {
                const tags = [`<title>${c.querySelector('#mtTitle').value}</title>`,
                    `<meta name="description" content="${c.querySelector('#mtDesc').value}">`,
                    `<meta name="viewport" content="width=device-width, initial-scale=1.0">`,
                    `<meta property="og:title" content="${c.querySelector('#mtTitle').value}">`,
                    `<meta property="og:description" content="${c.querySelector('#mtDesc').value}">`,
                    `<meta name="twitter:card" content="summary">`
                ];
                c.querySelector('#mtOutput').textContent = tags.join('\n');
                showToast('??? Meta tags generated');
            });
            c.querySelector('#mtCopy').addEventListener('click', () => copyText(c.querySelector('#mtOutput').textContent));
            c.querySelector('#mtGenerate').click();
        }

        function timestampTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Unix Timestamp (s)</label><input type="number" id="tsUnix" value="${Math.floor(Date.now()/1000)}"></div><div><label>Date</label><input type="datetime-local" id="tsDate"></div></div>
        <div class="row"><button id="tsToDate">?? ? Date</button><button id="tsToUnix" class="outline-btn">?? ? Timestamp</button><button id="tsNow" class="outline-btn">?? Now</button></div>
        <div class="output-box" id="tsOutput"><div>UTC: <span id="tsUtc">--</span></div><div>Local: <span id="tsLocal">--</span></div><div>ISO: <span id="tsIso">--</span></div></div><button class="outline-btn" id="tsCopy">?? Copy ISO</button>`;

            function updateFromUnix() {
                const unix = parseInt(c.querySelector('#tsUnix').value);
                if (isNaN(unix)) return;
                const d = new Date(unix * 1000);
                c.querySelector('#tsDate').value = d.toISOString().slice(0, 16);
                c.querySelector('#tsUtc').textContent = d.toUTCString();
                c.querySelector('#tsLocal').textContent = d.toLocaleString();
                c.querySelector('#tsIso').textContent = d.toISOString();
            }

            function updateFromDate() {
                const val = c.querySelector('#tsDate').value;
                if (!val) return;
                const d = new Date(val);
                const unix = Math.floor(d.getTime() / 1000);
                c.querySelector('#tsUnix').value = unix;
                c.querySelector('#tsUtc').textContent = d.toUTCString();
                c.querySelector('#tsLocal').textContent = d.toLocaleString();
                c.querySelector('#tsIso').textContent = d.toISOString();
            }
            c.querySelector('#tsToDate').addEventListener('click', updateFromUnix);
            c.querySelector('#tsToUnix').addEventListener('click', updateFromDate);
            c.querySelector('#tsNow').addEventListener('click', () => { c.querySelector('#tsUnix').value = Math.floor(Date
                    .now() / 1000);
                updateFromUnix(); });
            c.querySelector('#tsCopy').addEventListener('click', () => copyText(c.querySelector('#tsIso').textContent));
            updateFromUnix();
        }

        function baseConvTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Input</label><input id="bcInput" value="255"></div><div><label>From Base</label><select id="bcFrom"><option value="10">Decimal</option><option value="2">Binary</option><option value="8">Octal</option><option value="16">Hex</option></select></div></div>
        <button id="bcConvert">?? Convert</button>
        <div class="row"><div class="speed-metric"><div class="val" id="bcBin">--</div><div class="lbl">Binary</div></div><div class="speed-metric"><div class="val" id="bcOct">--</div><div class="lbl">Octal</div></div><div class="speed-metric"><div class="val" id="bcDec">--</div><div class="lbl">Decimal</div></div><div class="speed-metric"><div class="val" id="bcHex">--</div><div class="lbl">Hex</div></div></div>
        <button class="outline-btn" id="bcCopyAll">?? Copy All</button>`;
            c.querySelector('#bcConvert').addEventListener('click', () => {
                const val = c.querySelector('#bcInput').value.trim();
                const from = parseInt(c.querySelector('#bcFrom').value);
                try {
                    const dec = parseInt(val, from);
                    if (isNaN(dec)) throw new Error();
                    c.querySelector('#bcBin').textContent = dec.toString(2);
                    c.querySelector('#bcOct').textContent = dec.toString(8);
                    c.querySelector('#bcDec').textContent = dec.toString(10);
                    c.querySelector('#bcHex').textContent = dec.toString(16).toUpperCase();
                    showToast('?? Converted');
                } catch (e) { ['bcBin', 'bcOct', 'bcDec', 'bcHex'].forEach(id => c.querySelector('#' + id)
                        .textContent = 'Error'); }
            });
            c.querySelector('#bcCopyAll').addEventListener('click', () => copyText(
                `Binary: ${c.querySelector('#bcBin').textContent}\nOctal: ${c.querySelector('#bcOct').textContent}\nDecimal: ${c.querySelector('#bcDec').textContent}\nHex: ${c.querySelector('#bcHex').textContent}`
                ));
            c.querySelector('#bcConvert').click();
        }

        function cronParserTool(c) {
            c.innerHTML =
                `<label>Cron Expression (5 fields)</label><div class="row"><input id="cronInput" value="*/15 9-17 * * 1-5"><button id="cronParse" style="flex:0;">? Parse</button></div>
        <div class="output-box" id="cronOutput" style="min-height:100px;"></div><button class="outline-btn" id="cronCopy">?? Copy</button>`;
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            function parseField(field, names) {
                if (field === '*') return 'every';
                if (field.includes('/')) { const [r, s] = field.split('/'); return `every ${s} starting ${r==='*'?'0':r}`; }
                if (field.includes('-')) return `from ${field.split('-').join(' to ')}`;
                if (field.includes(',')) return field.split(',').map(v => names ? names[parseInt(v)] || v : v).join(', ');
                return names ? names[parseInt(field)] || field : field;
            }
            c.querySelector('#cronParse').addEventListener('click', () => {
                const expr = c.querySelector('#cronInput').value.trim().split(/\s+/);
                if (expr.length !== 5) { c.querySelector('#cronOutput').textContent = '? Need 5 fields.'; return; }
                const [m, h, dom, mon, dow] = expr;
                c.querySelector('#cronOutput').textContent =
                    `Minute: ${parseField(m)}\nHour: ${parseField(h)}\nDay of Month: ${parseField(dom)}\nMonth: ${parseField(mon,monthNames)}\nDay of Week: ${parseField(dow,dayNames)}`;
                showToast('? Cron parsed');
            });
            c.querySelector('#cronCopy').addEventListener('click', () => copyText(c.querySelector('#cronOutput')
            .textContent));
            c.querySelector('#cronParse').click();
        }

        function promptGeneratorTool(c) {
            c.innerHTML =
                `<label>? Your Topic</label><input type="text" id="pgTopic" value="hello"><button id="pgGenerate" style="width:100%;">?? Generate Prompt</button>
        <label>?? Generated Prompt</label><div class="output-box" id="pgOutput" style="min-height:80px;"></div><button class="outline-btn" id="pgCopy">?? Copy</button>`;
            const gen = () => { const t = c.querySelector('#pgTopic').value.trim(); if (!t) return;
                c.querySelector('#pgOutput').textContent =
                    `You are a knowledgeable assistant. Provide a clear response about: ${t}\n\n- Be professional and helpful.\n- Use structured paragraphs.\n- Provide examples if applicable.\n\nNow respond.`;
                showToast('?? Prompt generated!'); };
            c.querySelector('#pgGenerate').addEventListener('click', gen);
            c.querySelector('#pgTopic').addEventListener('keydown', e => { if (e.key === 'Enter') gen(); });
            c.querySelector('#pgCopy').addEventListener('click', () => copyText(c.querySelector('#pgOutput').textContent));
            gen();
        }

        function promptCreatorTool(c) {
            const defaults = [
                { id: 't1', category: '?? Code', title: 'Code Review',
                    template: 'Review this {language} code:\n```\n{code}\n```\nFocus: {focus}',
                placeholders: ['language', 'code', 'focus'] }, { id: 't2', category: '?? Writing', title: 'Blog Post',
                    template: 'Write a blog titled "{title}" for {audience}.\nTopic: {topic}\nTone: {tone}\nLength: {length} words',
                    placeholders: ['title', 'audience', 'topic', 'tone', 'length'] }
            ];
            let saved = [];
            try { saved = JSON.parse(localStorage.getItem('devtoolkit_prompt_templates') || '[]'); } catch (e) {}
            let all = [...defaults, ...saved];
            let sel = all.length ? all[0].id : null;
            c.innerHTML =
                `<div class="row"><div style="flex:1;max-width:250px;"><label>?? Templates</label><div id="pcList" style="max-height:350px;overflow-y:auto;border:1px solid var(--border);border-radius:12px;padding:8px;"></div></div><div style="flex:2;"><div id="pcEditor"><label>?? Edit</label><textarea id="pcTemplate" style="min-height:150px;"></textarea><label>Category</label><input id="pcCat" value="?? Custom"><div><button id="pcSave">?? Save</button><button id="pcUse" class="outline-btn">? Use Prompt</button></div></div></div></div>
        <div class="output-box" id="pcFinal" style="min-height:60px;">Select a template and fill placeholders...</div><button class="outline-btn" id="pcCopy">?? Copy Final</button>`;

            function renderList() {
                const list = c.querySelector('#pcList');
                list.innerHTML = all.map(t =>
                    `<div class="prompt-template-card${t.id===sel?' selected':''}" data-id="${t.id}"><h4>${t.title}</h4><div class="prompt-category">${t.category}</div></div>`
                    ).join('');
                if (!all.length) list.innerHTML = '<p style="color:#666;padding:20px;">No templates.</p>';
                list.querySelectorAll('.prompt-template-card').forEach(card => card.addEventListener('click',
                () => { sel = card.dataset.id;
                    renderList();
                    loadSelected(); }));
            }

            function loadSelected() { const tpl = all.find(t => t.id === sel); if (!tpl) return;
                c.querySelector('#pcTemplate').value = tpl.template;
                c.querySelector('#pcCat').value = tpl.category; }
            renderList();
            loadSelected();
            c.querySelector('#pcSave').addEventListener('click', () => { const tpl = all.find(t => t.id === sel); if (!
                    tpl) return;
                tpl.template = c.querySelector('#pcTemplate').value;
                tpl.category = c.querySelector('#pcCat').value; const existing = saved.findIndex(s => s.id ===
                    sel); if (existing >= 0) saved[existing] = tpl; else if (!defaults.find(d => d.id === sel))
                    saved.push(tpl); else { const nt = { ...tpl, id: 'saved_' + Date.now() };
                    saved.push(nt);
                    sel = nt.id; }
                localStorage.setItem('devtoolkit_prompt_templates', JSON.stringify(saved));
                all = [...defaults, ...saved];
                renderList();
                showToast('?? Saved!'); });
            c.querySelector('#pcUse').addEventListener('click', () => { let text = c.querySelector('#pcTemplate')
                    .value; const phs = [...new Set([...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]))]; if (phs
                    .length) { c.querySelector('#pcFinal').textContent = '?? Unfilled: ' + phs.map(p => '{' + p +
                        '}').join(', '); return; }
                c.querySelector('#pcFinal').textContent = text;
                showToast('? Prompt ready!'); });
            c.querySelector('#pcCopy').addEventListener('click', () => copyText(c.querySelector('#pcFinal')
            .textContent));
        }

        function base64Tool(c) {
            c.innerHTML =
                `<label>Input</label><textarea id="b64Input"></textarea><div class="row"><button id="b64Encode">?? Encode</button><button id="b64Decode" class="outline-btn">?? Decode</button><button id="b64Copy" class="outline-btn">?? Copy</button></div><div class="output-box" id="b64Output"></div>`;
            const inp = c.querySelector('#b64Input'),
                out = c.querySelector('#b64Output');
            c.querySelector('#b64Encode').addEventListener('click', () => { try { out.textContent = btoa(unescape(
                    encodeURIComponent(inp.value))); } catch (e) { out.textContent = 'Error: ' + e
                .message; } });
            c.querySelector('#b64Decode').addEventListener('click', () => { try { out.textContent =
                    decodeURIComponent(escape(atob(inp.value.trim()))); } catch (e) { out.textContent =
                    'Error: Invalid Base64'; } });
            c.querySelector('#b64Copy').addEventListener('click', () => copyText(out.textContent));
        }

        function urlEncodeTool(c) {
            c.innerHTML =
                `<label>Input</label><textarea id="urlInput"></textarea><div class="row"><button id="urlEncode">?? Encode</button><button id="urlDecode" class="outline-btn">?? Decode</button><button id="urlCopy" class="outline-btn">?? Copy</button></div><div class="output-box" id="urlOutput"></div>`;
            const inp = c.querySelector('#urlInput'),
                out = c.querySelector('#urlOutput');
            c.querySelector('#urlEncode').addEventListener('click', () => { out.textContent = encodeURIComponent(inp
                .value); });
            c.querySelector('#urlDecode').addEventListener('click', () => { try { out.textContent = decodeURIComponent(
                    inp.value); } catch (e) { out.textContent = 'Error: Invalid URL encoding'; } });
            c.querySelector('#urlCopy').addEventListener('click', () => copyText(out.textContent));
        }

        function wordCounterTool(c) {
            c.innerHTML =
                `<label>Paste text</label><textarea id="wcInput" style="min-height:150px;"></textarea>
        <div class="row"><div class="speed-metric"><div class="val" id="wcWords">0</div><div class="lbl">Words</div></div><div class="speed-metric"><div class="val" id="wcChars">0</div><div class="lbl">Chars</div></div><div class="speed-metric"><div class="val" id="wcLines">0</div><div class="lbl">Lines</div></div></div>`;
            c.querySelector('#wcInput').addEventListener('input', () => { const text = c.querySelector('#wcInput')
                    .value;
                c.querySelector('#wcWords').textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
                c.querySelector('#wcChars').textContent = text.length;
                c.querySelector('#wcLines').textContent = text ? text.split(/\n/).length : 0; });
        }

        function loremTool(c) {
            const words =
                "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum."
                .split(' ');
            c.innerHTML =
                `<div class="row"><div><label>Type</label><select id="loremType"><option value="paragraphs">Paragraphs</option><option value="sentences">Sentences</option><option value="words">Words</option></select></div><div><label>Count</label><input type="number" id="loremCount" value="3" min="1" max="100"></div></div>
        <button id="loremGen">?? Generate</button><div class="output-box" id="loremOutput"></div><button class="outline-btn" id="loremCopy">?? Copy</button>`;
            c.querySelector('#loremGen').addEventListener('click', () => { const type = c.querySelector('#loremType')
                    .value,
                    count = parseInt(c.querySelector('#loremCount').value) || 3; let r = ''; if (type ===
                    'words') { for (let i = 0; i < count; i++) r += words[i % words.length] + ' '; } else if (
                    type === 'sentences') { for (let i = 0; i < count; i++) r += words.slice((i * 12) % words
                        .length, (i * 12) % words.length + 8 + (i % 6)).join(' ') + '. '; } else { for (let i =
                        0; i < count; i++) r += words.slice((i * 40) % words.length, (i * 40) % words.length +
                        30 + (i % 20)).join(' ') + '.\n\n'; }
                c.querySelector('#loremOutput').textContent = r.trim(); });
            c.querySelector('#loremCopy').addEventListener('click', () => copyText(c.querySelector('#loremOutput')
            .textContent));
            c.querySelector('#loremGen').click();
        }

        function uuidTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Count</label><input type="number" id="uuidCount" value="1" min="1" max="50"></div></div>
        <button id="uuidGen">?? Generate</button><div class="output-box" id="uuidOutput"></div><button class="outline-btn" id="uuidCopy">?? Copy</button>`;
            c.querySelector('#uuidGen').addEventListener('click', () => { const count = parseInt(c.querySelector(
                    '#uuidCount').value) || 1; const uuids = []; for (let i = 0; i < count; i++) uuids.push(
                    crypto.randomUUID ? crypto.randomUUID() :
                    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() *
                        16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); })); c.querySelector(
                    '#uuidOutput').textContent = uuids.join('\n'); });
            c.querySelector('#uuidCopy').addEventListener('click', () => copyText(c.querySelector('#uuidOutput')
            .textContent));
            c.querySelector('#uuidGen').click();
        }

        function colorPickerTool(c) {
            c.innerHTML =
                `<input type="color" id="cpColor" value="#ff00ff" style="width:100px;height:60px;display:block;margin:0 auto;">
        <div class="row"><div class="speed-metric"><div class="val" id="cpHex">#ff00ff</div><div class="lbl">HEX</div></div><div class="speed-metric"><div class="val" id="cpRgb">rgb(255,0,255)</div><div class="lbl">RGB</div></div></div>
        <button class="outline-btn" id="cpCopyHex">?? Copy HEX</button>`;
            c.querySelector('#cpColor').addEventListener('input', () => { const hex = c.querySelector('#cpColor')
                .value;
                c.querySelector('#cpHex').textContent = hex;
                c.querySelector('#cpRgb').textContent =
                    `rgb(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)})`; });
            c.querySelector('#cpCopyHex').addEventListener('click', () => copyText(c.querySelector('#cpHex')
            .textContent));
            c.querySelector('#cpColor').dispatchEvent(new Event('input'));
        }

        function contrastTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Text</label><input type="color" id="ctText" value="#ffffff"></div><div><label>BG</label><input type="color" id="ctBg" value="#050510"></div></div>
        <div class="contrast-result" id="ctResult"></div><div class="speed-metric"><div class="val" id="ctRatio">--</div><div class="lbl">Ratio</div></div>`;
            const update = () => { const ratio = getContrastRatio(c.querySelector('#ctText').value, c.querySelector(
                    '#ctBg').value);
                c.querySelector('#ctRatio').textContent = ratio.toFixed(2) + ':1'; const res = c.querySelector(
                    '#ctResult');
                res.textContent = ratio >= 7 ? '? AAA' : ratio >= 4.5 ? '?? AA' : '? Fail';
                res.className = 'contrast-result ' + (ratio >= 3 ? 'contrast-pass' : 'contrast-fail');
                res.style.color = c.querySelector('#ctText').value;
                res.style.backgroundColor = c.querySelector('#ctBg').value; };
            ['ctText', 'ctBg'].forEach(id => c.querySelector('#' + id).addEventListener('input', update));
            update();
        }

        function getLuminance(hex) { const r = parseInt(hex.slice(1, 3), 16) / 255,
                g = parseInt(hex.slice(3, 5), 16) / 255,
                b = parseInt(hex.slice(5, 7), 16) / 255; const toLin = c => c <= 0.03928 ? c / 12.92 : Math.pow((c +
                    0.055) / 1.055, 2.4); return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b); }

        function getContrastRatio(c1, c2) { const l1 = getLuminance(c1),
                l2 = getLuminance(c2); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }

        function flexboxTool(c) {
            c.innerHTML =
                `<div class="flex-demo" id="flexDemo"><div class="flex-child">1</div><div class="flex-child">2</div><div class="flex-child">3</div></div>
        <div class="row"><div><label>Direction</label><select id="fxDir"><option value="row">Row</option><option value="column">Column</option></select></div><div><label>Justify</label><select id="fxJustify"><option value="flex-start">Start</option><option value="center">Center</option><option value="space-between">Space Between</option></select></div></div>
        <label>CSS</label><div class="output-box" id="fxCSS"></div><button class="outline-btn" id="fxCopy">?? Copy</button>`;
            const update = () => { const demo = c.querySelector('#flexDemo');
                demo.style.flexDirection = c.querySelector('#fxDir').value;
                demo.style.justifyContent = c.querySelector('#fxJustify').value;
                c.querySelector('#fxCSS').textContent =
                    `display: flex;\nflex-direction: ${c.querySelector('#fxDir').value};\njustify-content: ${c.querySelector('#fxJustify').value};`; };
            ['fxDir', 'fxJustify'].forEach(id => c.querySelector('#' + id).addEventListener('change', update));
            c.querySelector('#fxCopy').addEventListener('click', () => copyText(c.querySelector('#fxCSS').textContent));
            update();
        }

        function colorPlateTool(c) {
            c.innerHTML =
                `<input type="color" id="cpBase" value="#ff00ff" style="display:block;margin:0 auto;">
        <div id="cpSwatches" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:10px 0;"></div>
        <div class="tool-preview-box" id="cpPreview" style="background:#ff00ff;">#ff00ff</div>
        <button class="outline-btn" id="cpCopyAll">?? Copy All</button>`;
            const preview = c.querySelector('#cpPreview');
            const setPreview = (hex) => { preview.style.background = hex;
                preview.textContent = hex;
                preview.style.color = getContrastColor(hex); };
            const update = () => { const base = c.querySelector('#cpBase').value; const hsl = rgbToHsl(parseInt(base
                    .slice(1, 3), 16), parseInt(base.slice(3, 5), 16), parseInt(base.slice(5, 7), 16)); const
                    harmonies = [base];
                [180, 30, 330, 120, 240].forEach(d => harmonies.push(hslToHex((hsl[0] + d) % 360, hsl[1], hsl[
                    2]))); c.querySelector('#cpSwatches').innerHTML = [...new Set(harmonies)].map(h =>
                    `<div style="text-align:center;"><div class="color-swatch" style="background:${h};width:50px;height:50px;" data-hex="${h}"></div><span style="font-size:0.6rem;">${h}</span></div>`
                    ).join('');
                c.querySelectorAll('#cpSwatches .color-swatch').forEach(s => s.addEventListener('click', () => {
                    c.querySelectorAll('#cpSwatches .color-swatch').forEach(sw => sw.classList.remove('selected'));
                    s.classList.add('selected');
                    setPreview(s.dataset.hex);
                    copyText(s.dataset.hex); }));
                setPreview(base); };
            c.querySelector('#cpBase').addEventListener('input', update);
            c.querySelector('#cpCopyAll').addEventListener('click', () => copyText([...c.querySelectorAll(
                '#cpSwatches .color-swatch')].map(s => s.dataset.hex).join(', ')));
            update();
        }

        function getContrastColor(hex) { const r = parseInt(hex.slice(1, 3), 16),
                g = parseInt(hex.slice(3, 5), 16),
                b = parseInt(hex.slice(5, 7), 16); const yiq = (r * 299 + g * 587 + b * 114) / 1000;
            return yiq >= 140 ? '#111' : '#fff'; }

        function rgbToHsl(r, g, b) { r /= 255;
            g /= 255;
            b /= 255; const max = Math.max(r, g, b),
                min = Math.min(r, g, b); let h, s, l = (max + min) / 2; if (max === min) { h = s = 0; } else { const d =
                    max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min); switch (max) { case r:
                    h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break; case g:
                    h = ((b - r) / d + 2) / 6; break; case b:
                    h = ((r - g) / d + 4) / 6; break; } } return [Math.round(h * 360), Math.round(s * 100), Math
                .round(l * 100)]; }

        function hslToHex(h, s, l) { s /= 100;
            l /= 100; const a = s * Math.min(l, 1 - l); const f = n => { const k = (n + h / 30) % 12; return l - a * Math
                    .max(Math.min(k - 3, 9 - k, 1), -1); }; const toHex = x => Math.round(x * 255).toString(16)
                .padStart(2, '0'); return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4)); }

        function textFormatTool(c) {
            c.innerHTML =
                `<label>Input</label><textarea id="tfInput"></textarea>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0;"><button class="outline-btn tf-btn" data-action="upper">UPPER</button><button class="outline-btn tf-btn" data-action="lower">lower</button><button class="outline-btn tf-btn" data-action="title">Title</button><button class="outline-btn tf-btn" data-action="camel">camelCase</button><button class="outline-btn tf-btn" data-action="snake">snake_case</button><button class="outline-btn tf-btn" data-action="kebab">kebab-case</button><button class="outline-btn tf-btn" data-action="reverse">esreveR</button></div>
        <label>Output</label><div class="output-box" id="tfOutput"></div><button class="outline-btn" id="tfCopy">?? Copy</button>`;
            const inp = c.querySelector('#tfInput'),
                out = c.querySelector('#tfOutput');
            c.querySelectorAll('.tf-btn').forEach(btn => btn.addEventListener('click', () => { const text = inp.value;
                let r = ''; switch (btn.dataset.action) { case 'upper':
                    r = text.toUpperCase(); break; case 'lower':
                    r = text.toLowerCase(); break; case 'title':
                    r = text.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()); break;
                    case 'camel':
                        r = text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()); break;
                    case 'snake':
                        r = text.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''); break; case 'kebab':
                        r = text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); break; case 'reverse':
                        r = text.split('').reverse().join(''); break; }
                out.textContent = r; }));
            c.querySelector('#tfCopy').addEventListener('click', () => copyText(out.textContent));
        }

        function jsonFmtTool(c) {
            c.innerHTML =
                `<label>Paste JSON</label><textarea id="jsonInput" style="min-height:130px;"></textarea>
        <div class="row"><button id="jsonFormat">?? Format</button><button id="jsonMinify" class="outline-btn">??? Minify</button><button id="jsonCopy" class="outline-btn">?? Copy</button></div>
        <div class="output-box" id="jsonOutput"></div><p id="jsonMsg" style="text-align:center;font-size:0.8rem;"></p>`;
            const inp = c.querySelector('#jsonInput'),
                out = c.querySelector('#jsonOutput'),
                msg = c.querySelector('#jsonMsg');
            c.querySelector('#jsonFormat').addEventListener('click', () => { try { out.textContent = JSON.stringify(
                    JSON.parse(inp.value), null, 2);
                    msg.textContent = '? Valid JSON'; } catch (e) { msg.textContent = '? ' + e.message; } });
            c.querySelector('#jsonMinify').addEventListener('click', () => { try { out.textContent = JSON.stringify(
                    JSON.parse(inp.value)); } catch (e) { msg.textContent = '? ' + e.message; } });
            c.querySelector('#jsonCopy').addEventListener('click', () => copyText(out.textContent));
        }

        function cssMinTool(c) {
            c.innerHTML =
                `<label>Paste CSS</label><textarea id="cssInput" style="min-height:130px;"></textarea>
        <button id="cssMinify">??? Minify</button><div class="output-box" id="cssOutput"></div>
        <div class="row"><span id="cssStats"></span><button class="outline-btn" id="cssCopy">?? Copy</button></div>`;
            c.querySelector('#cssMinify').addEventListener('click', () => { let css = c.querySelector('#cssInput')
                    .value; const orig = css.length;
                css = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1')
                    .replace(/;\}/g, '}').trim();
                c.querySelector('#cssOutput').textContent = css;
                c.querySelector('#cssStats').textContent =
                    `Original: ${orig} ? Minified: ${css.length} chars`; });
            c.querySelector('#cssCopy').addEventListener('click', () => copyText(c.querySelector('#cssOutput')
            .textContent));
        }

        function jsMinTool(c) {
            c.innerHTML =
                `<label>Paste JS</label><textarea id="jsInput" style="min-height:130px;"></textarea>
        <button id="jsMinify">? Minify</button><div class="output-box" id="jsOutput"></div>
        <div class="row"><span id="jsStats"></span><button class="outline-btn" id="jsCopy">?? Copy</button></div>`;
            c.querySelector('#jsMinify').addEventListener('click', () => { let js = c.querySelector('#jsInput').value;
                const orig = js.length;
                js = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ').replace(
                    /\s*([{}();,:+\-*/<>=!&|?])\s*/g, '$1').trim();
                c.querySelector('#jsOutput').textContent = js;
                c.querySelector('#jsStats').textContent =
                `Original: ${orig} ? Minified: ${js.length} chars`; });
            c.querySelector('#jsCopy').addEventListener('click', () => copyText(c.querySelector('#jsOutput').textContent));
        }

        function regexTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Pattern</label><input id="rxPattern" value="\\d+"></div><div><label>Flags</label><input id="rxFlags" value="g" style="max-width:80px;"></div></div>
        <label>Test String</label><textarea id="rxInput">The year is 2024.</textarea>
        <button id="rxTest">?? Test</button><div class="output-box" id="rxOutput"></div>`;
            c.querySelector('#rxTest').addEventListener('click', () => { try { const regex = new RegExp(c.querySelector(
                        '#rxPattern').value, c.querySelector('#rxFlags').value); const matches = [...c
                    .querySelector('#rxInput').value.matchAll(regex)]; c.querySelector('#rxOutput')
                    .textContent = matches.length ? matches.map((m, i) =>
                        `Match ${i+1}: "${m[0]}" at ${m.index}`).join('\n') : 'No matches.'; } catch (e) { c
                    .querySelector('#rxOutput').textContent = '? ' + e.message; } });
            c.querySelector('#rxTest').click();
        }

        function diffTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Original</label><textarea id="diffOrig">Hello world\nLine two</textarea></div><div><label>Modified</label><textarea id="diffMod">Hello world\nLine changed\nNew line</textarea></div></div>
        <button id="diffCheck">?? Compare</button><div class="output-box" id="diffOutput" style="min-height:80px;"></div>`;
            c.querySelector('#diffCheck').addEventListener('click', () => { const orig = c.querySelector('#diffOrig')
                    .value.split('\n'),
                    mod = c.querySelector('#diffMod').value.split('\n'); let r = ''; for (let i = 0; i < Math.max(
                        orig.length, mod.length); i++) { const o = orig[i] || '',
                        m = mod[i] || ''; if (o === m) r +=
                        `<div class="diff-line">  ${o.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>`;
                    else { if (o && o !== m) r +=
                            `<div class="diff-line diff-removed">- ${o.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>`;
                        if (m && m !== o) r +=
                            `<div class="diff-line diff-added">+ ${m.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>`; } }
                c.querySelector('#diffOutput').innerHTML = r || 'No differences.'; });
            c.querySelector('#diffCheck').click();
        }

        function passwordTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Length</label><input type="number" id="pwLen" value="16" min="4" max="128"></div><div><label>Count</label><input type="number" id="pwCount" value="3" min="1" max="20"></div></div>
        <div><label><input type="checkbox" id="pwUpper" checked> Uppercase</label><label><input type="checkbox" id="pwLower" checked> Lowercase</label><label><input type="checkbox" id="pwDigits" checked> Digits</label><label><input type="checkbox" id="pwSymbols" checked> Symbols</label></div>
        <button id="pwGen">?? Generate</button><div class="output-box" id="pwOutput"></div><button class="outline-btn" id="pwCopy">?? Copy</button>`;
            c.querySelector('#pwGen').addEventListener('click', () => { let charset = ''; if (c.querySelector(
                    '#pwUpper').checked) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; if (c.querySelector('#pwLower')
                    .checked) charset += 'abcdefghijklmnopqrstuvwxyz'; if (c.querySelector('#pwDigits').checked)
                    charset += '0123456789'; if (c.querySelector('#pwSymbols').checked) charset += '!@#$%^&*()'; if (
                    !charset) return; const pws = []; for (let j = 0; j < (parseInt(c.querySelector('#pwCount')
                        .value) || 3); j++) { let pw = ''; const bytes = new Uint8Array(parseInt(c.querySelector(
                            '#pwLen').value) || 16);
                    crypto.getRandomValues(bytes); for (let i = 0; i < bytes.length; i++) pw += charset[bytes[i] %
                        charset.length];
                    pws.push(pw); }
                c.querySelector('#pwOutput').textContent = pws.join('\n'); });
            c.querySelector('#pwCopy').addEventListener('click', () => copyText(c.querySelector('#pwOutput').textContent));
            c.querySelector('#pwGen').click();
        }

        function hashTool(c) {
            c.innerHTML =
                `<label>Input</label><textarea id="hashInput">Hello World</textarea>
        <div class="row"><div><label>Algorithm</label><select id="hashAlgo"><option value="SHA-256">SHA-256</option><option value="SHA-512">SHA-512</option><option value="SHA-1">SHA-1</option></select></div></div>
        <button id="hashGen">#?? Generate</button><div class="output-box" id="hashOutput" style="word-break:break-all;"></div><button class="outline-btn" id="hashCopy">?? Copy</button>`;
            c.querySelector('#hashGen').addEventListener('click', async () => { try { const data = new TextEncoder()
                    .encode(c.querySelector('#hashInput').value); const hash = await crypto.subtle.digest(c
                    .querySelector('#hashAlgo').value, data);
                c.querySelector('#hashOutput').textContent = Array.from(new Uint8Array(hash)).map(b => b
                    .toString(16).padStart(2, '0')).join(''); } catch (e) { c.querySelector('#hashOutput')
                    .textContent = 'Error: ' + e.message; } });
            c.querySelector('#hashCopy').addEventListener('click', () => copyText(c.querySelector('#hashOutput')
            .textContent));
        }

        function qrGeneratorTool(c) {
            c.innerHTML =
                `<label>Text/URL</label><input id="qrText" value="https://example.com"><button id="qrGen">?? Generate QR</button>
        <div id="qrCanvasContainer" style="text-align:center;margin:10px 0;"></div><button class="outline-btn" id="qrDownload">?? Download PNG</button>`;
            c.querySelector('#qrGen').addEventListener('click', () => { const container = c.querySelector(
                    '#qrCanvasContainer');
                container.innerHTML = '<canvas id="qrCanvas"></canvas>';
                QRCode.toCanvas(c.querySelector('#qrCanvas'), c.querySelector('#qrText').value || ' ', { width: 256,
                    color: { dark: '#000000', light: '#ffffff' } }); });
            c.querySelector('#qrDownload').addEventListener('click', () => { const canvas = c.querySelector(
                '#qrCanvas'); if (!canvas) return; const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = 'qrcode.png';
                a.click(); });
            c.querySelector('#qrGen').click();
        }

        function qrReaderTool(c) {
            c.innerHTML =
                `<input type="file" id="qrFile" accept="image/*"><canvas id="qrReadCanvas" style="display:none;max-width:100%;"></canvas>
        <div class="output-box" id="qrReadOutput">Result here...</div><button class="outline-btn" id="qrReadCopy">?? Copy</button>`;
            c.querySelector('#qrFile').addEventListener('change', e => { const file = e.target.files[0]; if (!file)
                    return; const reader = new FileReader();
                reader.onload = ev => { const img = new Image();
                    img.onload = () => { const canvas = c.querySelector('#qrReadCanvas');
                        canvas.style.display = 'block';
                        canvas.width = img.width;
                        canvas.height = img.height; const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0); const code = jsQR(ctx.getImageData(0, 0, canvas.width,
                            canvas.height).data, canvas.width, canvas.height);
                        c.querySelector('#qrReadOutput').textContent = code ? code.data :
                            'No QR code found.'; };
                    img.src = ev.target.result; };
                reader.readAsDataURL(file); });
            c.querySelector('#qrReadCopy').addEventListener('click', () => copyText(c.querySelector('#qrReadOutput')
            .textContent));
        }

        function barcodeMakerTool(c) {
            c.innerHTML =
                `<label>Data</label><input id="bcText" value="123456789012">
        <div class="row"><div><label>Format</label><select id="bcFormat"><option value="CODE128">CODE128</option><option value="EAN13">EAN-13</option></select></div></div>
        <button id="bcGen">?? Generate</button><svg id="bcSvg" style="max-width:100%;"></svg><button class="outline-btn" id="bcDownload">?? Download SVG</button>`;
            c.querySelector('#bcGen').addEventListener('click', () => { try { JsBarcode(c.querySelector('#bcSvg'), c
                    .querySelector('#bcText').value, { format: c.querySelector('#bcFormat').value,
                    lineColor: '#00ffff', background: '#000', width: 2, height: 100,
                    displayValue: true }); } catch (e) { c.querySelector('#bcSvg').innerHTML =
                    '<text fill="#ff073a">Error</text>'; } });
            c.querySelector('#bcDownload').addEventListener('click', () => { const svg = c.querySelector('#bcSvg'); if (
                    !svg.innerHTML) return; const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' }); const a =
                    document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'barcode.svg';
                a.click(); });
            c.querySelector('#bcGen').click();
        }

        function barcodeReaderTool(c) {
            c.innerHTML =
                `<input type="file" id="bcFile" accept="image/*"><div class="output-box" id="bcReadOutput">Result here...</div><button class="outline-btn" id="bcReadCopy">?? Copy</button>`;
            c.querySelector('#bcFile').addEventListener('change', function(e) { const file = e.target.files[0]; if (!file)
                    return; const reader = new FileReader();
                reader.onload = ev => { const img = new Image();
                    img.onload = () => { const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height; const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0); if (typeof Quagga !== 'undefined') { Quagga
                            .decodeSingle({ decoder: { readers: ['ean_reader', 'upc_reader',
                                        'code_128_reader'
                                    ] }, locate: true, src: canvas.toDataURL() }, result => { c
                                    .querySelector('#bcReadOutput').textContent = result?.codeResult ?
                                    result.codeResult.code + ' (' + result.codeResult.format + ')' :
                                    'No barcode found.'; }); } };
                    img.src = ev.target.result; };
                reader.readAsDataURL(file); });
            c.querySelector('#bcReadCopy').addEventListener('click', () => copyText(c.querySelector('#bcReadOutput')
            .textContent));
        }

        function speedTestTool(c) {
            c.innerHTML =
                `<div class="speed-gauge" id="speedGauge" style="font-size:3rem;font-weight:900;text-shadow:0 0 30px var(--neon-lime);color:var(--neon-lime);text-align:center;">--</div><p id="speedStatus" style="text-align:center;color:#888;">Ready</p>
        <div class="row"><div class="speed-metric"><div class="val" id="pingVal">--</div><div class="lbl">Ping (ms)</div></div><div class="speed-metric"><div class="val" id="dlVal">--</div><div class="lbl">Download (Mbps)</div></div></div>
        <button id="startSpeedTest">?? Start Speed Test</button>`;
            c.querySelector('#startSpeedTest').addEventListener('click', async () => { const btn = c.querySelector(
                    '#startSpeedTest');
                btn.disabled = true;
                btn.textContent = '? Testing...'; try { const start = performance.now(); await fetch(
                        'https://speed.cloudflare.com/__down?bytes=0', { method: 'HEAD',
                        cache: 'no-store' });
                    c.querySelector('#pingVal').textContent = Math.round(performance.now() - start); const
                        dlStart = performance.now(); const data = await (await fetch(
                        'https://speed.cloudflare.com/__down?bytes=500000', { cache: 'no-store' }))
                        .arrayBuffer(); const dlMbps = (data.byteLength * 8) / ((performance.now() - dlStart) /
                        1000) / 1000000;
                    c.querySelector('#dlVal').textContent = dlMbps.toFixed(2);
                    c.querySelector('#speedGauge').textContent = dlMbps.toFixed(1);
                    c.querySelector('#speedStatus').textContent = '? Complete'; } catch (e) { c.querySelector(
                        '#speedStatus').textContent = '? Failed'; }
                btn.disabled = false;
                btn.textContent = '?? Start Speed Test'; });
        }

        function stopwatchTimerTool(c) {
            c.innerHTML =
                `<div class="tab-bar"><button class="tab-btn active" data-tab="sw">?? Stopwatch</button><button class="tab-btn" data-tab="tm">? Timer</button></div>
        <div id="swPanel"><div class="time-display" id="swDisplay">00:00:00.00</div><div class="row"><button id="swStart">? Start</button><button id="swLap" class="outline-btn" disabled>?? Lap</button><button id="swReset" class="outline-btn">?? Reset</button></div><div class="lap-list" id="lapList"></div></div>
        <div id="tmPanel" style="display:none;"><div class="time-display" id="tmDisplay">00:00:00</div><div class="row"><div><label>Hr</label><input type="number" id="tmHr" value="0" min="0"></div><div><label>Min</label><input type="number" id="tmMin" value="5" min="0"></div><div><label>Sec</label><input type="number" id="tmSec" value="0" min="0"></div></div><div class="row"><button id="tmStart">? Start</button><button id="tmPause" class="outline-btn" disabled>? Pause</button><button id="tmReset" class="outline-btn">?? Reset</button></div></div>`;
            c.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => { c.querySelectorAll(
                    '.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                c.querySelector('#swPanel').style.display = btn.dataset.tab === 'sw' ? 'block' : 'none';
                c.querySelector('#tmPanel').style.display = btn.dataset.tab === 'tm' ? 'block' : 'none'; }));
            let swRunning = false,
                swStartTime = 0,
                swElapsed = 0,
                swInterval = null,
                lapCount = 0;
            const swDisplay = c.querySelector('#swDisplay'),
                lapList = c.querySelector('#lapList');
            const formatSW = ms => { const cs = Math.floor(ms / 10) % 100,
                    s = Math.floor(ms / 1000) % 60,
                    m = Math.floor(ms / 60000) % 60,
                    h = Math.floor(ms / 3600000); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`; };
            const updateSW = () => { swDisplay.textContent = formatSW(swElapsed + (swRunning ? performance.now() -
                    swStartTime : 0)); };
            c.querySelector('#swStart').addEventListener('click', function() { if (!swRunning) { swRunning = true;
                    swStartTime = performance.now();
                    this.textContent = '? Stop';
                    c.querySelector('#swLap').disabled = false;
                    swInterval = setInterval(updateSW, 16); } else { swRunning = false;
                    swElapsed += performance.now() - swStartTime;
                    this.textContent = '? Start';
                    c.querySelector('#swLap').disabled = true;
                    clearInterval(swInterval);
                    updateSW(); } });
            c.querySelector('#swLap').addEventListener('click', () => { lapCount++; const div = document.createElement(
                    'div');
                div.className = 'lap-item';
                div.innerHTML =
                    `<span>Lap ${lapCount}</span><span>${formatSW(swElapsed+(swRunning?performance.now()-swStartTime:0))}</span>`;
                lapList.insertBefore(div, lapList.firstChild); });
            c.querySelector('#swReset').addEventListener('click', () => { swRunning = false;
                swElapsed = 0;
                lapCount = 0;
                clearInterval(swInterval);
                swDisplay.textContent = '00:00:00.00';
                c.querySelector('#swStart').textContent = '? Start';
                c.querySelector('#swLap').disabled = true;
                lapList.innerHTML = ''; });
            const tmDisplay = c.querySelector('#tmDisplay'),
                tmStart = c.querySelector('#tmStart'),
                tmPause = c.querySelector('#tmPause'),
                tmReset = c.querySelector('#tmReset');
            const getTimerMs = () => ((parseInt(c.querySelector('#tmHr').value) || 0) * 3600 + (parseInt(c.querySelector(
                '#tmMin').value) || 0) * 60 + (parseInt(c.querySelector('#tmSec').value) || 0)) * 1000;
            const updateTimerUI = () => { const rem = globalTimer.remaining;
                tmDisplay.textContent = formatTimeMS(rem); if (globalTimer.expired) { tmStart.textContent =
                        '? Start';
                    tmPause.disabled = true; } else if (globalTimer.running) { tmStart.textContent = '? Stop';
                    tmPause.disabled = false; } else { tmStart.textContent = '? Start';
                    tmPause.disabled = true; } };
            tmStart.addEventListener('click', () => { if (globalTimer.running) pauseGlobalTimer(); else if (globalTimer
                    .expired) { stopGlobalTimer(true);
                    startGlobalTimer(getTimerMs()); } else { if (globalTimer.remaining <= 0) startGlobalTimer(
                        getTimerMs()); else resumeGlobalTimer(); }
                updateTimerUI(); });
            tmPause.addEventListener('click', () => { pauseGlobalTimer();
                updateTimerUI(); });
            tmReset.addEventListener('click', () => { stopGlobalTimer(true);
                globalTimer.remaining = getTimerMs();
                tmDisplay.textContent = formatTimeMS(globalTimer.remaining);
                updateTimerUI(); });
            updateTimerUI();
        }

        function notesTool(c) {
            function getNotes() { try { return JSON.parse(localStorage.getItem('devtoolkit_notes') || '[]'); } catch (
                e) { return []; } }

            function saveNotes(n) { localStorage.setItem('devtoolkit_notes', JSON.stringify(n)); }
            let notes = getNotes(),
                selectedId = null;

            function renderUI() { const list = c.querySelector('#notesList'),
                    editor = c.querySelector('#noteEditor');
                list.innerHTML = notes.length ? notes.sort((a, b) => b.updatedAt - a.updatedAt).map(n =>
                    `<div class="note-card ${n.id===selectedId?'selected':''}" data-id="${n.id}"><h4>${n.title||'Untitled'}</h4><div class="note-date">${new Date(n.updatedAt).toLocaleString()}</div><div class="note-preview">${n.content?n.content.slice(0,60):'Empty...'}</div></div>`
                    ).join('') : '<p style="color:#666;">No notes yet.</p>'; if (selectedId && notes.find(n => n.id ===
                        selectedId)) { const n = notes.find(n => n.id === selectedId);
                    c.querySelector('#noteTitle').value = n.title;
                    c.querySelector('#noteContent').value = n.content;
                    editor.style.display = 'block';
                    c.querySelector('#noteDelete').style.display = 'inline-block'; } else { editor.style.display =
                        'none';
                    c.querySelector('#noteDelete').style.display = 'none'; } }
            c.innerHTML =
                `<div class="row"><button id="newNoteBtn">?? New Note</button><button id="noteDelete" class="danger-btn" style="display:none;">??? Delete</button></div>
        <div class="notes-list" id="notesList"></div><div id="noteEditor" style="display:none;"><label>Title</label><input id="noteTitle"><label>Content</label><textarea id="noteContent" style="min-height:150px;"></textarea></div>`;
            c.querySelector('#newNoteBtn').onclick = () => { const n = { id: Date.now().toString(36), title: '',
                    content: '', createdAt: Date.now(), updatedAt: Date.now() };
                notes.push(n);
                selectedId = n.id;
                saveNotes(notes);
                renderUI(); };
            c.querySelector('#noteDelete').onclick = () => { if (selectedId && confirm('Delete?')) { notes = notes.filter(
                        n => n.id !== selectedId);
                    selectedId = notes.length ? notes[notes.length - 1].id : null;
                    saveNotes(notes);
                    renderUI(); } };
            c.querySelector('#notesList').addEventListener('click', e => { const card = e.target.closest('.note-card');
                if (card) { selectedId = card.dataset.id;
                    renderUI(); } });
            c.querySelector('#noteTitle').addEventListener('input', () => { const n = notes.find(n => n.id ===
                selectedId); if (n) { n.title = c.querySelector('#noteTitle').value;
                    n.updatedAt = Date.now();
                    saveNotes(notes); } });
            c.querySelector('#noteContent').addEventListener('input', () => { const n = notes.find(n => n.id ===
                selectedId); if (n) { n.content = c.querySelector('#noteContent').value;
                    n.updatedAt = Date.now();
                    saveNotes(notes); } });
            if (notes.length && !selectedId) selectedId = notes.sort((a, b) => b.updatedAt - a.updatedAt)[0].id;
            renderUI();
        }

        function ttsTool(c) {
            c.innerHTML =
                `<label>Text to speak</label><textarea id="ttsText">Hello! This is DevToolKit Pro.</textarea>
        <div class="row"><div><label>Rate: <span id="ttsRateVal">1.0</span>x</label><input type="range" id="ttsRate" min="0.1" max="3" step="0.1" value="1"></div></div>
        <div class="row"><button id="ttsSpeak">?? Speak</button><button id="ttsStop" class="outline-btn">? Stop</button></div>`;
            const synth = window.speechSynthesis;
            c.querySelector('#ttsRate').addEventListener('input', function() { c.querySelector('#ttsRateVal')
                .textContent = this.value; });
            c.querySelector('#ttsSpeak').addEventListener('click', () => { const text = c.querySelector('#ttsText')
                    .value.trim(); if (!text) return;
                synth.cancel(); const u = new SpeechSynthesisUtterance(text);
                u.rate = parseFloat(c.querySelector('#ttsRate').value);
                synth.speak(u); });
            c.querySelector('#ttsStop').addEventListener('click', () => synth.cancel());
        }

        function unitConverterTool(c) {
            const cats = { length: { units: [{ id: 'meter', name: 'Meter', factor: 1 }, { id: 'kilometer',
                        name: 'Kilometer', factor: 1000 }, { id: 'mile', name: 'Mile', factor: 1609.344 },
                    { id: 'foot', name: 'Foot', factor: 0.3048 }] }, weight: { units: [{ id: 'kilogram',
                        name: 'Kilogram', factor: 1 }, { id: 'gram', name: 'Gram', factor: 0.001 }, { id: 'pound',
                        name: 'Pound', factor: 0.453592 }] }, temperature: { units: [{ id: 'celsius',
                        name: 'Celsius', factor: 1 }, { id: 'fahrenheit', name: 'Fahrenheit', factor: 1 },
                    { id: 'kelvin', name: 'Kelvin', factor: 1 }] } };
            c.innerHTML =
                `<div class="row"><div><label>Category</label><select id="ucCat">${Object.entries(cats).map(([k])=>`<option value="${k}">${k}</option>`).join('')}</select></div></div>
        <div class="converter-row"><div><label>Value</label><input type="number" id="ucInput" value="1"></div><div><label>From</label><select id="ucFrom"></select></div><div class="swap-icon" id="ucSwap">??</div><div><label>To</label><select id="ucTo"></select></div></div>
        <div class="result-badge" id="ucResult">--</div>`;
            const populate = () => { const cat = cats[c.querySelector('#ucCat').value]; const opts = cat.units.map(u =>
                    `<option value="${u.id}">${u.name}</option>`).join('');
                c.querySelector('#ucFrom').innerHTML = opts;
                c.querySelector('#ucTo').innerHTML = opts; if (cat.units.length >= 2) { c.querySelector('#ucFrom')
                        .value = cat.units[0].id;
                    c.querySelector('#ucTo').value = cat.units[cat.units.length - 1].id; }
                updateResult(); };
            const updateResult = () => { const val = parseFloat(c.querySelector('#ucInput').value); if (isNaN(val))
                    return; const catId = c.querySelector('#ucCat').value; const cat = cats[catId]; const from = cat
                    .units.find(u => u.id === c.querySelector('#ucFrom').value); const to = cat.units.find(u => u.id ===
                        c.querySelector('#ucTo').value); if (!from || !to) return; let result; if (catId ===
                    'temperature') { let celsius; if (from.id === 'celsius') celsius = val; else if (from.id ===
                        'fahrenheit') celsius = (val - 32) * 5 / 9; else celsius = val - 273.15; if (to.id ===
                        'celsius') result = celsius; else if (to.id === 'fahrenheit') result = celsius * 9 / 5 + 32;
                    else result = celsius + 273.15; } else { result = (val * from.factor) / to.factor; }
                c.querySelector('#ucResult').textContent = result.toFixed(4) + ' ' + to.name; };
            c.querySelector('#ucCat').addEventListener('change', populate);
            ['ucFrom', 'ucTo'].forEach(id => c.querySelector('#' + id).addEventListener('change', updateResult));
            c.querySelector('#ucInput').addEventListener('input', updateResult);
            c.querySelector('#ucSwap').addEventListener('click', () => { const t = c.querySelector('#ucFrom').value;
                c.querySelector('#ucFrom').value = c.querySelector('#ucTo').value;
                c.querySelector('#ucTo').value = t;
                updateResult(); });
            populate();
        }

        function unicodeEscapeTool(c) {
            c.innerHTML =
                `<label>Input</label><textarea id="ueInput">Hello ??</textarea>
        <div class="row"><button id="ueEscape">?? Escape</button><button id="ueUnescape" class="outline-btn">?? Unescape</button><button id="ueCopy" class="outline-btn">?? Copy</button></div>
        <div class="output-box" id="ueOutput"></div>`;
            const inp = c.querySelector('#ueInput'),
                out = c.querySelector('#ueOutput');
            c.querySelector('#ueEscape').addEventListener('click', () => { out.textContent = [...inp.value].map(ch =>
                ch.codePointAt(0) > 127 ? '\\u' + ch.codePointAt(0).toString(16).padStart(4, '0') : ch).join(
                ''); });
            c.querySelector('#ueUnescape').addEventListener('click', () => { out.textContent = inp.value.replace(
                /\\u([\dA-Fa-f]{4})/g, (_, g) => String.fromCharCode(parseInt(g, 16))); });
            c.querySelector('#ueCopy').addEventListener('click', () => copyText(out.textContent));
        }

        function csv2jsonTool(c) {
            c.innerHTML =
                `<label>CSV Input</label><textarea id="c2jInput">name,age,city\nAlice,30,NYC\nBob,25,LA</textarea>
        <button id="c2jConvert">?? Convert to JSON</button><div class="output-box" id="c2jOutput"></div><button class="outline-btn" id="c2jCopy">?? Copy</button>`;
            c.querySelector('#c2jConvert').addEventListener('click', () => { const csv = c.querySelector('#c2jInput')
                    .value.trim(); const lines = csv.split('\n'); if (lines.length < 2) return; const headers = lines[
                        0].split(',').map(h => h.trim()); const json = lines.slice(1).map(line => { const vals = line
                        .split(','); const obj = {};
                    headers.forEach((h, i) => obj[h] = (vals[i] || '').trim()); return obj; });
                c.querySelector('#c2jOutput').textContent = JSON.stringify(json, null, 2); });
            c.querySelector('#c2jCopy').addEventListener('click', () => copyText(c.querySelector('#c2jOutput')
            .textContent));
            c.querySelector('#c2jConvert').click();
        }

        function cssGridTool(c) {
            c.innerHTML =
                `<div class="grid-demo" id="gridDemo" style="grid-template-columns:repeat(3,1fr);"><div class="grid-child">1</div><div class="grid-child">2</div><div class="grid-child">3</div><div class="grid-child">4</div></div>
        <div class="row"><div><label>Columns</label><input id="gCols" value="repeat(3, 1fr)"></div><div><label>Gap</label><input id="gGap" value="8px"></div></div>
        <label>CSS</label><div class="output-box" id="gCSS"></div><button class="outline-btn" id="gCopy">?? Copy</button>`;
            const update = () => { const demo = c.querySelector('#gridDemo');
                demo.style.gridTemplateColumns = c.querySelector('#gCols').value;
                demo.style.gap = c.querySelector('#gGap').value;
                c.querySelector('#gCSS').textContent =
                    `display: grid;\ngrid-template-columns: ${c.querySelector('#gCols').value};\ngap: ${c.querySelector('#gGap').value};`; };
            ['gCols', 'gGap'].forEach(id => c.querySelector('#' + id).addEventListener('input', update));
            c.querySelector('#gCopy').addEventListener('click', () => copyText(c.querySelector('#gCSS').textContent));
            update();
        }

        function glassmorphismTool(c) {
            c.innerHTML =
                `<div class="glass-preview" id="glassPreview" style="background:rgba(255,255,255,0.15);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.3);">Glass Effect</div>
        <div class="row"><div><label>Blur</label><input type="range" id="gBlur" min="0" max="30" value="12"></div><div><label>Opacity</label><input type="range" id="gOpacity" min="0" max="100" value="15"></div></div>
        <div class="row"><div><label>Tint Color</label><input type="color" id="gColor" value="#ffffff"></div><div><label>Border Opacity</label><input type="range" id="gBorderOpacity" min="0" max="100" value="30"></div></div>
        <label>CSS</label><div class="output-box" id="gOutCSS"></div><button class="outline-btn" id="gCopyCSS">?? Copy</button>`;
            const hexToRgb = hex => { const h = hex.replace('#', '');
                const bigint = parseInt(h, 16);
                return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]; };
            const update = () => { const blur = c.querySelector('#gBlur').value; const op = c.querySelector('#gOpacity')
                    .value / 100; const borderOp = c.querySelector('#gBorderOpacity').value / 100; const hex = c
                    .querySelector('#gColor').value; const [r, g, b] = hexToRgb(hex); const preview = c.querySelector(
                    '#glassPreview');
                preview.style.background = `rgba(${r},${g},${b},${op})`;
                preview.style.backdropFilter = `blur(${blur}px)`;
                preview.style.webkitBackdropFilter = `blur(${blur}px)`;
                preview.style.border = `1px solid rgba(${r},${g},${b},${borderOp})`;
                c.querySelector('#gOutCSS').textContent =
                    `background: rgba(${r},${g},${b},${op});\nbackdrop-filter: blur(${blur}px);\n-webkit-backdrop-filter: blur(${blur}px);\nborder: 1px solid rgba(${r},${g},${b},${borderOp});\nborder-radius: 20px;`; };
            ['gBlur', 'gOpacity', 'gColor', 'gBorderOpacity'].forEach(id => c.querySelector('#' + id).addEventListener(
                'input', update));
            c.querySelector('#gCopyCSS').addEventListener('click', () => copyText(c.querySelector('#gOutCSS')
            .textContent));
            update();
        }

        function animGenTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Animation Name</label><input id="animName" value="pulse"></div><div><label>Duration (s)</label><input type="number" id="animDur" value="1" min="0.1" step="0.1"></div></div>
        <div class="row"><div><label>From</label><input id="animFrom" value="scale(1)"></div><div><label>To</label><input id="animTo" value="scale(1.1)"></div></div>
        <label>Preview</label>
        <div class="css-preview-panel"><div id="animPreviewBox" style="width:60px;height:60px;border-radius:12px;background:linear-gradient(135deg,var(--neon-cyan),var(--neon-magenta));"></div></div>
        <label>Generated Keyframes</label><div class="output-box" id="animOutput"></div><button class="outline-btn" id="animCopy">?? Copy</button>`;
            let styleTag = document.getElementById('animPreviewStyle');
            if (!styleTag) { styleTag = document.createElement('style');
                styleTag.id = 'animPreviewStyle';
                document.head.appendChild(styleTag); }
            const update = () => { const name = c.querySelector('#animName').value || 'pulse'; const dur = c.querySelector(
                    '#animDur').value; const from = c.querySelector('#animFrom').value; const to = c.querySelector(
                    '#animTo').value;
                c.querySelector('#animOutput').textContent =
                    `@keyframes ${name} {\n  0% { transform: ${from}; }\n  100% { transform: ${to}; }\n}\n\n.element {\n  animation: ${name} ${dur}s ease-in-out infinite;\n}`;
                const previewName = 'animPreview_' + name;
                styleTag.textContent =
                    `@keyframes ${previewName} { 0% { transform: ${from}; } 100% { transform: ${to}; } }`;
                const box = c.querySelector('#animPreviewBox');
                box.style.animation = 'none';
                void box.offsetWidth;
                box.style.animation = `${previewName} ${dur}s ease-in-out infinite alternate`; };
            ['animName', 'animDur', 'animFrom', 'animTo'].forEach(id => c.querySelector('#' + id).addEventListener(
                'input', update));
            c.querySelector('#animCopy').addEventListener('click', () => copyText(c.querySelector('#animOutput')
            .textContent));
            update();
        }

        function colorFromImageTool(c) {
            c.innerHTML =
                `<input type="file" id="cfiFile" accept="image/*"><div id="cfiPalette" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:10px 0;"></div>
        <button class="outline-btn" id="cfiCopy">?? Copy Palette</button>`;
            c.querySelector('#cfiFile').addEventListener('change', function(e) { const file = e.target.files[0]; if (!
                    file) return; const reader = new FileReader();
                reader.onload = ev => { const img = new Image();
                    img.onload = () => { const canvas = document.createElement('canvas'); const size = 100;
                        canvas.width = size;
                        canvas.height = size; const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, size, size); const data = ctx.getImageData(0, 0,
                            size, size).data; const colors = {}; for (let i = 0; i < data.length; i +=
                            4) { const hex = '#' + [data[i], data[i + 1], data[i + 2]].map(v => v
                                .toString(16).padStart(2, '0')).join('');
                            colors[hex] = (colors[hex] || 0) + 1; } const sorted = Object.entries(
                            colors).sort((a, b) => b[1] - a[1]).slice(0, 8); const palette = c.querySelector(
                            '#cfiPalette');
                        palette.innerHTML = sorted.map(([hex]) =>
                            `<div style="text-align:center;"><div class="color-palette-swatch" style="background:${hex};" data-hex="${hex}"></div><span style="font-size:0.6rem;">${hex}</span></div>`
                            ).join('');
                        palette.querySelectorAll('.color-palette-swatch').forEach(s => s.addEventListener(
                            'click', () => copyText(s.dataset.hex))); };
                    img.src = ev.target.result; };
                reader.readAsDataURL(file); });
            c.querySelector('#cfiCopy').addEventListener('click', () => copyText([...c.querySelectorAll(
                '.color-palette-swatch')].map(s => s.dataset.hex).join(', ')));
        }

        function yaml2jsonTool(c) {
            c.innerHTML =
                `<label>YAML Input</label><textarea id="y2jInput">name: John\nage: 30\ncity: NYC</textarea>
        <button id="y2jConvert">?? Convert to JSON</button><div class="output-box" id="y2jOutput"></div><button class="outline-btn" id="y2jCopy">?? Copy</button>`;
            c.querySelector('#y2jConvert').addEventListener('click', () => { const yaml = c.querySelector('#y2jInput')
                    .value; const lines = yaml.split('\n'); const obj = {};
                lines.forEach(line => { const match = line.match(/^(\s*)([\w-]+):\s*(.*)/); if (match) { const key =
                        match[2].trim(); let val = match[3].trim(); if (!isNaN(val) && val !== '') val = Number(
                        val); else if (val === 'true') val = true; else if (val === 'false') val = false;
                    obj[key] = val; } });
                c.querySelector('#y2jOutput').textContent = JSON.stringify(obj, null, 2); });
            c.querySelector('#y2jCopy').addEventListener('click', () => copyText(c.querySelector('#y2jOutput')
            .textContent));
            c.querySelector('#y2jConvert').click();
        }

        function snippetTool(c) {
            const snippets = {
                js: [
                    { name: 'Fetch GET', code: "fetch('url').then(r=>r.json()).then(d=>console.log(d))" },
                    { name: 'Arrow Func', code: 'const fn = (x) => x * 2;' },
                ],
                css: [
                    { name: 'Flex Center',
                        code: 'display:flex;justify-content:center;align-items:center;' },
                    { name: 'Grid 3 Col', code: 'display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;' },
                ],
                html: [
                    { name: 'Meta Viewport',
                    code: '<meta name="viewport" content="width=device-width,initial-scale=1.0">' },
                ]
            };
            c.innerHTML =
                `<div id="snipTabs" style="display:flex;gap:4px;margin-bottom:10px;">${Object.keys(snippets).map(k=>`<span class="snippet-badge${k==='js'?' active':''}" data-lang="${k}">${k.toUpperCase()}</span>`).join('')}</div>
        <div id="snipList"></div><div class="output-box" id="snipOutput"></div><button class="outline-btn" id="snipCopy">?? Copy</button>`;
            const renderSnips = lang => { c.querySelector('#snipList').innerHTML = snippets[lang].map(s =>
                    `<div class="prompt-template-card" data-code="${s.code.replace(/"/g,'&quot;')}"><h4>${s.name}</h4><div class="prompt-preview">${s.code.slice(0,50)}...</div></div>`
                    ).join('');
                c.querySelectorAll('#snipList .prompt-template-card').forEach(card => card.addEventListener('click',
                    () => { c.querySelector('#snipOutput').textContent = card.dataset.code.replace(/&quot;/g,
                        '"'); })); };
            c.querySelectorAll('.snippet-badge').forEach(b => b.addEventListener('click', function() { c
                    .querySelectorAll('.snippet-badge').forEach(x => x.classList.remove('active'));
                this.classList.add('active');
                renderSnips(this.dataset.lang); }));
            c.querySelector('#snipCopy').addEventListener('click', () => copyText(c.querySelector('#snipOutput')
            .textContent));
            renderSnips('js');
        }

        function certDecodeTool(c) {
            c.innerHTML =
                `<label>Paste Certificate (PEM)</label><textarea id="certInput" style="min-height:130px;">-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----</textarea>
        <button id="certDecode">?? Decode</button><div class="output-box" id="certOutput" style="min-height:100px;"></div>`;
            c.querySelector('#certDecode').addEventListener('click', () => { const pem = c.querySelector('#certInput')
                    .value.trim(); const b64 = pem.replace(/-----(BEGIN|END) CERTIFICATE-----/g, '').replace(/\s/g,
                        ''); try { const binary = atob(b64); const hex = [...binary].map(ch => ch.charCodeAt(0)
                        .toString(16).padStart(2, '0')).join(' ');
                    c.querySelector('#certOutput').textContent =
                        `Decoded (hex): ${hex.slice(0,500)}...\n\nLength: ${binary.length} bytes`; } catch (e) { c
                        .querySelector('#certOutput').textContent = '? Invalid certificate format.'; } });
        }

        function pomodoroTool(c) {
            c.innerHTML =
                `<div class="time-display" id="pomDisplay">25:00</div><div class="pomodoro-phase work" id="pomPhase">WORK</div>
        <div class="row"><button id="pomStart">? Start</button><button id="pomPause" class="outline-btn" disabled>? Pause</button><button id="pomReset" class="outline-btn">?? Reset</button></div>
        <div class="row"><div class="speed-metric"><div class="val" id="pomCount">0</div><div class="lbl">Sessions</div></div></div>`;
            let pomRunning = false,
                pomRemaining = 25 * 60 * 1000,
                pomInterval = null,
                pomSessions = 0,
                pomIsBreak = false,
                pomStartTime = 0,
                pomPausedRemaining = 25 * 60 * 1000;
            const pomDisplay = c.querySelector('#pomDisplay'),
                pomPhase = c.querySelector('#pomPhase');
            const updatePomDisplay = () => { const rem = pomRemaining; const m = Math.floor(rem / 60000),
                    s = Math.floor((rem % 60000) / 1000);
                pomDisplay.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; };
            const pomTick = () => { const now = performance.now();
                pomRemaining = pomPausedRemaining - (now - pomStartTime); if (pomRemaining <= 0) { pomRemaining =
                        0;
                    pomRunning = false;
                    clearInterval(pomInterval);
                    playBeep(660, 0.3); if (pomIsBreak) { pomIsBreak = false;
                        pomRemaining = 25 * 60 * 1000;
                        pomPhase.textContent = 'WORK';
                        pomPhase.className = 'pomodoro-phase work'; } else { pomSessions++;
                        c.querySelector('#pomCount').textContent = pomSessions;
                        pomIsBreak = true;
                        pomRemaining = 5 * 60 * 1000;
                        pomPhase.textContent = 'BREAK';
                        pomPhase.className = 'pomodoro-phase break'; }
                    pomPausedRemaining = pomRemaining;
                    updatePomDisplay();
                    c.querySelector('#pomStart').textContent = '? Start';
                    c.querySelector('#pomPause').disabled = true; return; }
                updatePomDisplay(); };
            c.querySelector('#pomStart').addEventListener('click', function() { if (!pomRunning) { pomRunning =
                        true;
                    pomStartTime = performance.now();
                    pomPausedRemaining = pomRemaining;
                    this.textContent = '? Stop';
                    c.querySelector('#pomPause').disabled = false;
                    pomInterval = setInterval(pomTick, 200); } else { pomRunning = false;
                    clearInterval(pomInterval);
                    this.textContent = '? Start';
                    c.querySelector('#pomPause').disabled = true; } });
            c.querySelector('#pomPause').addEventListener('click', () => { if (pomRunning) { const now = performance
                        .now();
                    pomPausedRemaining = pomRemaining - (now - pomStartTime);
                    pomRemaining = pomPausedRemaining;
                    pomRunning = false;
                    clearInterval(pomInterval);
                    c.querySelector('#pomStart').textContent = '? Start';
                    c.querySelector('#pomPause').disabled = true;
                    updatePomDisplay(); } });
            c.querySelector('#pomReset').addEventListener('click', () => { pomRunning = false;
                clearInterval(pomInterval);
                pomIsBreak = false;
                pomRemaining = 25 * 60 * 1000;
                pomPausedRemaining = pomRemaining;
                pomPhase.textContent = 'WORK';
                pomPhase.className = 'pomodoro-phase work';
                c.querySelector('#pomStart').textContent = '? Start';
                c.querySelector('#pomPause').disabled = true;
                updatePomDisplay(); });
            updatePomDisplay();
        }

        function ipInfoTool(c) {
            c.innerHTML =
                `<button id="ipCheck">?? Get My IP Info</button><div class="output-box" id="ipOutput" style="min-height:80px;"></div>`;
            c.querySelector('#ipCheck').addEventListener('click', async () => { const out = c.querySelector(
                '#ipOutput');
                out.textContent = '? Fetching...'; try { const res = await (await fetch(
                    'https://ipapi.co/json/')).json();
                out.textContent = Object.entries(res).map(([k, v]) => `${k}: ${v}`).join('\n'); } catch (e) { out
                    .textContent = '? Failed to fetch IP info.'; } });
        }

        function currencyTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Amount</label><input type="number" id="curAmt" value="1"></div><div><label>From</label><select id="curFrom"><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></div><div class="swap-icon" id="curSwap">??</div><div><label>To</label><select id="curTo"><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option></select></div></div>
        <button id="curConvert">?? Convert</button><div class="result-badge" id="curResult">--</div>
        <p style="font-size:0.7rem;color:#666;text-align:center;">Uses exchangerate.host API</p>`;
            c.querySelector('#curConvert').addEventListener('click', async () => { const amt = parseFloat(c.querySelector(
                    '#curAmt').value); const from = c.querySelector('#curFrom').value; const to = c.querySelector(
                    '#curTo').value; if (isNaN(amt)) return; try { const res = await (await fetch(
                    `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amt}`)).json();
                c.querySelector('#curResult').textContent = `${amt} ${from} = ${res.result.toFixed(2)} ${to}`; } catch (
                    e) { c.querySelector('#curResult').textContent = '? Failed'; } });
            c.querySelector('#curSwap').addEventListener('click', () => { const t = c.querySelector('#curFrom').value;
                c.querySelector('#curFrom').value = c.querySelector('#curTo').value;
                c.querySelector('#curTo').value = t; });
            c.querySelector('#curConvert').click();
        }

        function imageCompressTool(c) {
            c.innerHTML =
                `<input type="file" id="imgCompFile" accept="image/*"><div class="row"><div><label>Quality</label><input type="range" id="imgCompQ" min="10" max="100" value="60"></div><span id="imgCompQVal">60%</span></div>
        <div style="text-align:center;margin:10px 0;"><img id="imgCompPreview" style="max-width:100%;max-height:300px;display:none;border-radius:12px;"></div>
        <button class="outline-btn" id="imgCompDownload" disabled>?? Download Compressed</button><span id="imgCompStats" style="font-size:0.7rem;color:#888;"></span>`;
            let compBlob = null;
            c.querySelector('#imgCompQ').addEventListener('input', function() { c.querySelector('#imgCompQVal')
                    .textContent = this.value + '%'; if (compBlob) compressImg(); });
            c.querySelector('#imgCompFile').addEventListener('change', function(e) { const file = e.target.files[0]; if (
                    !file) return; const reader = new FileReader();
                reader.onload = ev => { c.querySelector('#imgCompPreview').src = ev.target.result;
                    c.querySelector('#imgCompPreview').style.display = 'block';
                    compBlob = file;
                    compressImg(); };
                reader.readAsDataURL(file); });

            function compressImg() {
                if (!compBlob) return; const img = new Image();
                img.onload = () => { const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height; const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0); const q = parseInt(c.querySelector('#imgCompQ').value) / 100;
                    canvas.toBlob(blob => { compBlob = blob;
                        c.querySelector('#imgCompDownload').disabled = false;
                        c.querySelector('#imgCompStats').textContent =
                            `Compressed: ${(blob.size/1024).toFixed(1)} KB`; }, 'image/jpeg', q); };
                img.src = c.querySelector('#imgCompPreview').src;
            }
            c.querySelector('#imgCompDownload').addEventListener('click', () => { if (!compBlob) return; const a =
                    document.createElement('a');
                a.href = URL.createObjectURL(compBlob);
                a.download = 'compressed.jpg';
                a.click(); });
        }

        // === 47 NEW TOOLS ===
        function hexEncodeTool(c) {
            c.innerHTML =
                `<label>Input</label><textarea id="hexInput">Hello World</textarea>
        <div class="row"><button id="hexEncode">?? To Hex</button><button id="hexDecode" class="outline-btn">?? From Hex</button><button id="hexCopy" class="outline-btn">?? Copy</button></div>
        <div class="output-box" id="hexOutput"></div>`;
            const inp = c.querySelector('#hexInput'),
                out = c.querySelector('#hexOutput');
            c.querySelector('#hexEncode').addEventListener('click', () => { out.textContent = [...inp.value].map(ch => ch
                    .charCodeAt(0).toString(16).padStart(2, '0')).join(' '); });
            c.querySelector('#hexDecode').addEventListener('click', () => { try { out.textContent = inp.value.replace(
                        /\s/g, '').match(/.{1,2}/g).map(h => String.fromCharCode(parseInt(h, 16))).join(
                    ''); } catch (e) { out.textContent = '? Invalid hex'; } });
            c.querySelector('#hexCopy').addEventListener('click', () => copyText(out.textContent));
        }

        function binaryTextTool(c) {
            c.innerHTML =
                `<label>Input</label><textarea id="binInput">Hello</textarea>
        <div class="row"><button id="binToBin">0?? Text?Binary</button><button id="binToText" class="outline-btn">?? Binary?Text</button><button id="binCopy" class="outline-btn">?? Copy</button></div>
        <div class="output-box" id="binOutput"></div>`;
            const inp = c.querySelector('#binInput'),
                out = c.querySelector('#binOutput');
            c.querySelector('#binToBin').addEventListener('click', () => { out.textContent = [...inp.value].map(ch => ch
                    .charCodeAt(0).toString(2).padStart(8, '0')).join(' '); });
            c.querySelector('#binToText').addEventListener('click', () => { try { out.textContent = inp.value.replace(
                        /\s/g, '').match(/.{1,8}/g).map(b => String.fromCharCode(parseInt(b, 2))).join(
                    ''); } catch (e) { out.textContent = '? Invalid binary'; } });
            c.querySelector('#binCopy').addEventListener('click', () => copyText(out.textContent));
        }

        function morseCodeTool(c) {
            const morse = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..',
                J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...',
                T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----',
                2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
                ' ': '/' };
            const revMorse = Object.fromEntries(Object.entries(morse).map(([k, v]) => [v, k]));
            c.innerHTML =
                `<label>Input</label><textarea id="morseInput">SOS</textarea>
        <div class="row"><button id="morseEnc">?? Encode</button><button id="morseDec" class="outline-btn">?? Decode</button><button id="morseCopy" class="outline-btn">?? Copy</button></div>
        <div class="output-box" id="morseOutput"></div>`;
            const inp = c.querySelector('#morseInput'),
                out = c.querySelector('#morseOutput');
            c.querySelector('#morseEnc').addEventListener('click', () => { out.textContent = [...inp.value.toUpperCase()]
                    .map(ch => morse[ch] || ch).join(' '); });
            c.querySelector('#morseDec').addEventListener('click', () => { out.textContent = inp.value.split(/\s+/).map(s =>
                    revMorse[s] || s).join(''); });
            c.querySelector('#morseCopy').addEventListener('click', () => copyText(out.textContent));
        }

        function slugifyTool(c) {
            c.innerHTML =
                `<label>Input</label><textarea id="slugInput">Hello World! This is a Test.</textarea>
        <button id="slugGen">?? Generate Slug</button><div class="output-box" id="slugOutput"></div><button class="outline-btn" id="slugCopy">?? Copy</button>`;
            c.querySelector('#slugGen').addEventListener('click', () => { c.querySelector('#slugOutput').textContent = c
                    .querySelector('#slugInput').value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g,
                        '-').replace(/-+/g, '-').trim(); });
            c.querySelector('#slugCopy').addEventListener('click', () => copyText(c.querySelector('#slugOutput')
            .textContent));
            c.querySelector('#slugGen').click();
        }

        function findReplaceTool(c) {
            c.innerHTML =
                `<label>Text</label><textarea id="frText">The quick brown fox</textarea>
        <div class="row"><div><label>Find</label><input id="frFind" value="fox"></div><div><label>Replace</label><input id="frReplace" value="dog"></div></div>
        <button id="frDo">?? Replace All</button><div class="output-box" id="frOutput"></div><button class="outline-btn" id="frCopy">?? Copy</button>`;
            c.querySelector('#frDo').addEventListener('click', () => { const txt = c.querySelector('#frText').value; const
                    find = c.querySelector('#frFind').value; const rep = c.querySelector('#frReplace').value;
                c.querySelector('#frOutput').textContent = txt.split(find).join(rep); });
            c.querySelector('#frCopy').addEventListener('click', () => copyText(c.querySelector('#frOutput').textContent));
            c.querySelector('#frDo').click();
        }

        function lineSortTool(c) {
            c.innerHTML =
                `<label>Lines (one per line)</label><textarea id="lsInput">banana\napple\ncherry</textarea>
        <div class="row"><button id="lsAsc">?? Sort A-Z</button><button id="lsDesc" class="outline-btn">?? Sort Z-A</button><button id="lsCopy" class="outline-btn">?? Copy</button></div>
        <div class="output-box" id="lsOutput"></div>`;
            const inp = c.querySelector('#lsInput'),
                out = c.querySelector('#lsOutput');
            c.querySelector('#lsAsc').addEventListener('click', () => { out.textContent = inp.value.split('\n').sort().join(
                    '\n'); });
            c.querySelector('#lsDesc').addEventListener('click', () => { out.textContent = inp.value.split('\n').sort((a,
                    b) => b.localeCompare(a)).join('\n'); });
            c.querySelector('#lsCopy').addEventListener('click', () => copyText(out.textContent));
        }

        function dedupeTool(c) {
            c.innerHTML =
                `<label>Lines</label><textarea id="ddInput">apple\nbanana\napple\ncherry</textarea>
        <button id="ddDo">?? Remove Duplicates</button><div class="output-box" id="ddOutput"></div><button class="outline-btn" id="ddCopy">?? Copy</button>`;
            c.querySelector('#ddDo').addEventListener('click', () => { c.querySelector('#ddOutput').textContent = [...new
                    Set(c.querySelector('#ddInput').value.split('\n'))].join('\n'); });
            c.querySelector('#ddCopy').addEventListener('click', () => copyText(c.querySelector('#ddOutput').textContent));
            c.querySelector('#ddDo').click();
        }

        function asciiTableTool(c) {
            c.innerHTML =
                `<div class="output-box" id="asciiOut" style="max-height:400px;overflow-y:auto;font-size:0.8rem;"></div>`;
            let tbl = '';
            for (let i = 32; i < 127; i++) tbl +=
                `${String(i).padStart(3)} | ${String.fromCharCode(i)} | 0x${i.toString(16).padStart(2,'0')}\n`;
            c.querySelector('#asciiOut').textContent = 'Dec | Ch | Hex\n' + tbl;
        }

        function borderRadiusTool(c) {
            c.innerHTML =
                `<div style="width:150px;height:150px;background:linear-gradient(135deg,var(--neon-cyan),var(--neon-magenta));margin:20px auto;border-radius:20px;" id="brPreview"></div>
        <div class="row"><div><label>All Corners</label><input type="range" id="brAll" min="0" max="100" value="20"></div></div>
        <label>CSS</label><div class="output-box" id="brCSS"></div><button class="outline-btn" id="brCopy">?? Copy</button>`;
            const update = () => { const v = c.querySelector('#brAll').value + 'px';
                c.querySelector('#brPreview').style.borderRadius = v;
                c.querySelector('#brCSS').textContent = `border-radius: ${v};`; };
            c.querySelector('#brAll').addEventListener('input', update);
            c.querySelector('#brCopy').addEventListener('click', () => copyText(c.querySelector('#brCSS').textContent));
            update();
        }

        function textShadowTool(c) {
            c.innerHTML =
                `<div style="font-size:2.5rem;text-align:center;padding:30px;color:#fff;text-shadow:2px 2px 4px rgba(0,0,0,0.5);" id="tsPreview">Shadow Text</div>
        <div class="row"><div><label>X</label><input type="range" id="tsX" min="-20" max="20" value="2"></div><div><label>Y</label><input type="range" id="tsY" min="-20" max="20" value="2"></div><div><label>Blur</label><input type="range" id="tsBlur" min="0" max="30" value="4"></div></div>
        <div class="row"><div><label>Colour</label><input type="color" id="tsColor" value="#000000"></div><div><label>Opacity</label><input type="range" id="tsOpacity" min="0" max="100" value="50"></div></div>
        <label>CSS</label><div class="output-box" id="tsCSS"></div><button class="outline-btn" id="tsCopy">?? Copy</button>`;
            const hexToRgb = (hex) => { const h = hex.replace('#', ''); const r = parseInt(h.substring(0, 2), 16); const g =
                    parseInt(h.substring(2, 4), 16); const b = parseInt(h.substring(4, 6), 16); return `${r}, ${g}, ${b}`; };
            const update = () => { const opacity = c.querySelector('#tsOpacity').value / 100; const rgb = hexToRgb(c
                    .querySelector('#tsColor').value); const sv =
                    `${c.querySelector('#tsX').value}px ${c.querySelector('#tsY').value}px ${c.querySelector('#tsBlur').value}px rgba(${rgb}, ${opacity.toFixed(2)})`;
                c.querySelector('#tsPreview').style.textShadow = sv;
                c.querySelector('#tsCSS').textContent = `text-shadow: ${sv};`; };
            ['tsX', 'tsY', 'tsBlur', 'tsColor', 'tsOpacity'].forEach(id => c.querySelector('#' + id).addEventListener(
                'input', update));
            c.querySelector('#tsCopy').addEventListener('click', () => copyText(c.querySelector('#tsCSS').textContent));
            update();
        }

        function cssFilterTool(c) {
            c.innerHTML =
                `<div style="text-align:center;padding:20px;font-size:3rem;filter:blur(0px) brightness(1);" id="cfPreview">??</div>
        <div class="row"><div><label>Blur</label><input type="range" id="cfBlur" min="0" max="20" value="0"></div><div><label>Brightness</label><input type="range" id="cfBright" min="0" max="300" value="100"></div></div>
        <label>CSS</label><div class="output-box" id="cfCSS"></div><button class="outline-btn" id="cfCopy">?? Copy</button>`;
            const update = () => { const fv =
                    `blur(${c.querySelector('#cfBlur').value}px) brightness(${c.querySelector('#cfBright').value/100})`;
                c.querySelector('#cfPreview').style.filter = fv;
                c.querySelector('#cfCSS').textContent = `filter: ${fv};`; };
            ['cfBlur', 'cfBright'].forEach(id => c.querySelector('#' + id).addEventListener('input', update));
            c.querySelector('#cfCopy').addEventListener('click', () => copyText(c.querySelector('#cfCSS').textContent));
            update();
        }

        function cubicBezierTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>X1</label><input type="range" id="cbX1" min="0" max="100" value="42"></div><div><label>Y1</label><input type="range" id="cbY1" min="0" max="100" value="0"></div><div><label>X2</label><input type="range" id="cbX2" min="0" max="100" value="58"></div><div><label>Y2</label><input type="range" id="cbY2" min="0" max="100" value="100"></div></div>
        <div class="output-box" id="cbOutput"></div><button class="outline-btn" id="cbCopy">?? Copy</button>`;
            const update = () => { const vals = ['cbX1', 'cbY1', 'cbX2', 'cbY2'].map(id => (c.querySelector('#' + id)
                    .value / 100).toFixed(2));
                c.querySelector('#cbOutput').textContent =
                `cubic-bezier(${vals[0]}, ${vals[1]}, ${vals[2]}, ${vals[3]})`; };
            ['cbX1', 'cbY1', 'cbX2', 'cbY2'].forEach(id => c.querySelector('#' + id).addEventListener('input',
            update));
            c.querySelector('#cbCopy').addEventListener('click', () => copyText(c.querySelector('#cbOutput')
            .textContent));
            update();
        }

        function clipPathTool(c) {
            const shapes = ['circle(50% at 50% 50%)', 'polygon(50% 0%,0% 100%,100% 100%)',
                'ellipse(50% 35% at 50% 50%)', 'polygon(50% 0%,100% 38%,82% 100%,18% 100%,0% 38%)',
            'inset(10% 20% 10% 20%)'];
            c.innerHTML =
                `<div style="width:180px;height:180px;background:linear-gradient(135deg,var(--neon-cyan),var(--neon-magenta));margin:20px auto;clip-path:circle(50% at 50% 50%);" id="cpPreview"></div>
        <div class="row"><div><label>Shape</label><select id="cpShape">${shapes.map((s,i)=>`<option value="${s}">Shape ${i+1}</option>`).join('')}</select></div></div>
        <label>CSS</label><div class="output-box" id="cpCSS"></div><button class="outline-btn" id="cpCopy">?? Copy</button>`;
            const update = () => { const v = c.querySelector('#cpShape').value;
                c.querySelector('#cpPreview').style.clipPath = v;
                c.querySelector('#cpCSS').textContent = `clip-path: ${v};`; };
            c.querySelector('#cpShape').addEventListener('change', update);
            c.querySelector('#cpCopy').addEventListener('click', () => copyText(c.querySelector('#cpCSS').textContent));
            update();
        }

        function cssUnitsTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Value</label><input type="number" id="cuVal" value="16"></div><div><label>From</label><select id="cuFrom"><option value="px">px</option><option value="rem">rem</option><option value="em">em</option></select></div><div class="swap-icon" id="cuSwap">??</div><div><label>To</label><select id="cuTo"><option value="rem">rem</option><option value="px">px</option><option value="em">em</option></select></div></div>
        <div class="result-badge" id="cuResult">--</div>`;
            const update = () => { const val = parseFloat(c.querySelector('#cuVal').value); const from = c.querySelector(
                    '#cuFrom').value; const to = c.querySelector('#cuTo').value; let result; if (from === 'px' && to ===
                    'rem') result = val / 16 + 'rem'; else if (from === 'rem' && to === 'px') result = val * 16 +
                    'px'; else if (from === 'px' && to === 'em') result = (val / 16).toFixed(2) + 'em'; else if (from ===
                    'em' && to === 'px') result = (val * 16).toFixed(0) + 'px'; else result = val + to;
                c.querySelector('#cuResult').textContent = result; };
            ['cuVal', 'cuFrom', 'cuTo'].forEach(id => c.querySelector('#' + id).addEventListener('input', update));
            c.querySelector('#cuSwap').addEventListener('click', () => { const t = c.querySelector('#cuFrom').value;
                c.querySelector('#cuFrom').value = c.querySelector('#cuTo').value;
                c.querySelector('#cuTo').value = t;
                update(); });
            update();
        }

        function svgShapeTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Shape</label><select id="svgShape"><option value="circle">Circle</option><option value="rect">Rectangle</option><option value="star">Star</option></select></div><div><label>Fill</label><input type="color" id="svgFill" value="#00ffff"></div></div>
        <div style="text-align:center;margin:10px 0;" id="svgContainer"></div>
        <label>SVG Code</label><div class="output-box" id="svgCode"></div><button class="outline-btn" id="svgCopy">?? Copy</button>`;
            const update = () => { const shape = c.querySelector('#svgShape').value; const fill = c.querySelector(
                    '#svgFill').value; let svg = ''; if (shape === 'circle') svg =
                    `<svg width="120" height="120" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="50" fill="${fill}"/></svg>`; else if (
                    shape === 'rect') svg =
                    `<svg width="150" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="150" height="100" rx="10" fill="${fill}"/></svg>`; else
                    svg =
                    `<svg width="120" height="120" xmlns="http://www.w3.org/2000/svg"><polygon points="60,5 75,45 115,45 82,72 92,115 60,88 28,115 38,72 5,45 45,45" fill="${fill}"/></svg>`;
                c.querySelector('#svgContainer').innerHTML = svg;
                c.querySelector('#svgCode').textContent = svg; };
            ['svgShape', 'svgFill'].forEach(id => c.querySelector('#' + id).addEventListener('input', update));
            c.querySelector('#svgCopy').addEventListener('click', () => copyText(c.querySelector('#svgCode')
            .textContent));
            update();
        }

        function htmlFmtTool(c) {
            c.innerHTML =
                `<label>Paste HTML</label><textarea id="htmlFmtInput" style="min-height:130px;"><div><p>Hello</p></div></textarea>
        <button id="htmlFmtBtn">?? Format</button><div class="output-box" id="htmlFmtOutput"></div><button class="outline-btn" id="htmlFmtCopy">?? Copy</button>`;
            c.querySelector('#htmlFmtBtn').addEventListener('click', () => { let html = c.querySelector('#htmlFmtInput')
                    .value; let indent = 0; const formatted = html.replace(/(<\/?[^>]+>)/g, (match) => { if (match
                        .match(/^<\//)) indent = Math.max(0, indent - 1); const line = '  '.repeat(indent) + match +
                        '\n'; if (match.match(/^<[^/!][^>]*[^/]>$/)) indent++; return line; });
                c.querySelector('#htmlFmtOutput').textContent = formatted.trim(); });
            c.querySelector('#htmlFmtCopy').addEventListener('click', () => copyText(c.querySelector('#htmlFmtOutput')
            .textContent));
            c.querySelector('#htmlFmtBtn').click();
        }

        function xmlFmtTool(c) {
            c.innerHTML =
                `<label>Paste XML</label><textarea id="xmlFmtInput" style="min-height:130px;"><root><item>value</item></root></textarea>
        <button id="xmlFmtBtn">?? Format</button><div class="output-box" id="xmlFmtOutput"></div><button class="outline-btn" id="xmlFmtCopy">?? Copy</button>`;
            c.querySelector('#xmlFmtBtn').addEventListener('click', () => { let xml = c.querySelector('#xmlFmtInput')
                    .value; let indent = 0; const formatted = xml.replace(/(<\/?[^>]+>)/g, (match) => { if (match
                        .match(/^<\//)) indent = Math.max(0, indent - 1); const line = '  '.repeat(indent) + match +
                        '\n'; if (match.match(/^<[^/!][^>]*[^/]>$/)) indent++; return line; });
                c.querySelector('#xmlFmtOutput').textContent = formatted.trim(); });
            c.querySelector('#xmlFmtCopy').addEventListener('click', () => copyText(c.querySelector('#xmlFmtOutput')
            .textContent));
            c.querySelector('#xmlFmtBtn').click();
        }

        function jsBeautifyTool(c) {
            c.innerHTML =
                `<label>Paste Minified JS</label><textarea id="jsbInput">const x=1;function a(b){return b+2;}</textarea>
        <button id="jsbBtn">? Beautify</button><div class="output-box" id="jsbOutput"></div><button class="outline-btn" id="jsbCopy">?? Copy</button>`;
            c.querySelector('#jsbBtn').addEventListener('click', () => { let js = c.querySelector('#jsbInput').value;
                js = js.replace(/;/g, ';\n').replace(/\{/g, '{\n  ').replace(/\}/g, '\n}\n').replace(/\n\s*\n/g,
                    '\n').replace(/,\s*/g, ', ').trim();
                c.querySelector('#jsbOutput').textContent = js; });
            c.querySelector('#jsbCopy').addEventListener('click', () => copyText(c.querySelector('#jsbOutput')
            .textContent));
            c.querySelector('#jsbBtn').click();
        }

        function cssBeautifyTool(c) {
            c.innerHTML =
                `<label>Paste Minified CSS</label><textarea id="cssbInput">body{color:red;margin:0;}</textarea>
        <button id="cssbBtn">?? Beautify</button><div class="output-box" id="cssbOutput"></div><button class="outline-btn" id="cssbCopy">?? Copy</button>`;
            c.querySelector('#cssbBtn').addEventListener('click', () => { let css = c.querySelector('#cssbInput').value;
                css = css.replace(/\{/g, '{\n  ').replace(/\}/g, '\n}\n').replace(/;/g, ';\n  ').replace(/\n\s*\n/g,
                    '\n').trim();
                c.querySelector('#cssbOutput').textContent = css; });
            c.querySelector('#cssbCopy').addEventListener('click', () => copyText(c.querySelector('#cssbOutput')
            .textContent));
            c.querySelector('#cssbBtn').click();
        }

        function unicodeLookupTool(c) {
            c.innerHTML =
                `<label>Enter character or code point (e.g., A or U+0041 or 65)</label><input id="ulInput" value="A">
        <button id="ulLookup">?? Lookup</button><div class="output-box" id="ulOutput"></div>`;
            c.querySelector('#ulLookup').addEventListener('click', () => { const inp = c.querySelector('#ulInput')
                    .value.trim(); let cp; if (inp.startsWith('U+') || inp.startsWith('u+')) cp = parseInt(inp.slice(
                        2), 16); else if (/^\d+$/.test(inp)) cp = parseInt(inp); else cp = inp.codePointAt(0); const
                    ch = String.fromCodePoint(cp);
                c.querySelector('#ulOutput').textContent =
                    `Character: ${ch}\nCode Point: U+${cp.toString(16).toUpperCase().padStart(4,'0')}\nDecimal: ${cp}`; });
            c.querySelector('#ulLookup').click();
        }

        function gitignoreTool(c) {
            const templates = { node: 'node_modules/\n.env\n*.log', python: '__pycache__/\n*.pyc\n.env' };
            c.innerHTML =
                `<div class="row"><div><label>Template</label><select id="giTemplate">${Object.keys(templates).map(k=>`<option value="${k}">${k}</option>`).join('')}</select></div></div>
        <button id="giGen">?? Generate</button><div class="output-box" id="giOutput"></div><button class="outline-btn" id="giCopy">?? Copy</button>`;
            c.querySelector('#giGen').addEventListener('click', () => { c.querySelector('#giOutput').textContent =
                    templates[c.querySelector('#giTemplate').value]; });
            c.querySelector('#giCopy').addEventListener('click', () => copyText(c.querySelector('#giOutput').textContent));
            c.querySelector('#giGen').click();
        }

        function licenseGenTool(c) {
            const licenses = { MIT: 'MIT License\n\nCopyright (c) ' + new Date().getFullYear() +
                    '\n\nPermission is hereby granted...', Apache: 'Apache License 2.0\n\nCopyright ' + new Date()
                    .getFullYear() + '\n\nLicensed under the Apache License...' };
            c.innerHTML =
                `<div class="row"><div><label>License Type</label><select id="licType">${Object.keys(licenses).map(k=>`<option value="${k}">${k}</option>`).join('')}</select></div><div><label>Author</label><input id="licAuthor" value="Developer"></div></div>
        <button id="licGen">?? Generate</button><div class="output-box" id="licOutput" style="min-height:120px;"></div><button class="outline-btn" id="licCopy">?? Copy</button>`;
            c.querySelector('#licGen').addEventListener('click', () => { c.querySelector('#licOutput').textContent =
                    licenses[c.querySelector('#licType').value].replace('Copyright (c)', `Copyright (c) ${c.querySelector('#licAuthor').value}`); });
            c.querySelector('#licCopy').addEventListener('click', () => copyText(c.querySelector('#licOutput')
            .textContent));
            c.querySelector('#licGen').click();
        }

        function htmlEntitiesRefTool(c) {
            const ents = [
                ['&amp;', '&', 'ampersand'],
                ['&lt;', '<', 'less than'],
                ['&gt;', '>', 'greater than'],
                ['&quot;', '"', 'quotation mark'],
                ['&apos;', "'", 'apostrophe'],
                ['&nbsp;', ' ', 'non-breaking space'],
                ['&copy;', '©', 'copyright'],
                ['&reg;', '®', 'registered'],
                ['&trade;', '™', 'trademark'],
                ['&euro;', '€', 'euro'],
                ['&pound;', '£', 'pound'],
                ['&yen;', '¥', 'yen'],
            ];
            c.innerHTML =
                `<div class="output-box" id="herOutput" style="max-height:400px;overflow-y:auto;">${ents.map(e=>`${e[0]} ? ${e[1]} (${e[2]})`).join('\n')}</div>
        <button class="outline-btn" id="herCopy">?? Copy All</button>`;
            c.querySelector('#herCopy').addEventListener('click', () => copyText(c.querySelector('#herOutput')
            .textContent));
        }

        function rsaInfoTool(c) {
            c.innerHTML =
                `<div class="output-box" style="min-height:120px;">?? RSA Key Info Generator\n\nRSA is an asymmetric encryption algorithm.\nKey sizes: 2048-bit (recommended), 4096-bit.\n\nGenerate via CLI:\nopenssl genrsa -out private.pem 2048\nopenssl rsa -in private.pem -pubout -out public.pem</div>`;
        }

        function sslCheckTool(c) {
            c.innerHTML =
                `<label>Domain</label><input id="sslDomain" value="example.com"><button id="sslCheck">?? Check SSL</button>
        <div class="output-box" id="sslOutput" style="min-height:80px;"></div><p style="font-size:0.7rem;color:#666;">Checks if HTTPS is available</p>`;
            c.querySelector('#sslCheck').addEventListener('click', async () => { const domain = c.querySelector(
                    '#sslDomain').value.trim(); const out = c.querySelector('#sslOutput');
                out.textContent = '? Checking...'; try { const res = await fetch(
                    `https://${domain}`, { method: 'HEAD', mode: 'no-cors' });
                    out.textContent = `? ${domain} is accessible via HTTPS.`; } catch (e) { out.textContent =
                        `? Could not verify SSL for ${domain}.`; } });
        }

        function securityHeadersTool(c) {
            const headers = [
                'Content-Security-Policy',
                'X-Content-Type-Options: nosniff',
                'X-Frame-Options: DENY',
                'Strict-Transport-Security: max-age=31536000',
                'X-XSS-Protection: 1; mode=block',
                'Referrer-Policy: strict-origin-when-cross-origin',
            ];
            c.innerHTML =
                `<div class="output-box" style="min-height:150px;">??? Recommended Security Headers:\n\n${headers.join('\n')}</div>
        <button class="outline-btn" id="shCopy">?? Copy</button>`;
            c.querySelector('#shCopy').addEventListener('click', () => copyText(c.querySelector('.output-box')
            .textContent));
        }

        function bcryptGenTool(c) {
            c.innerHTML =
                `<label>Input</label><textarea id="bcryptInput">MyPassword</textarea>
        <button id="bcryptGen">?? Generate Bcrypt Hash</button><div class="output-box" id="bcryptOutput"></div>
        <p style="font-size:0.7rem;color:#ffaa00;">Bcrypt is a secure password hashing algorithm. In a real app, use a server-side library.</p>`;
            c.querySelector('#bcryptGen').addEventListener('click', () => { const inp = c.querySelector('#bcryptInput')
                    .value;
                c.querySelector('#bcryptOutput').textContent =
                    `?? Bcrypt requires a server. Example hash format:\n$2b$12$LJ3m4ys3GZ...\n\nInput: "${inp}" would be securely hashed.`; });
        }

        function vcardQrTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Name</label><input id="vcName" value="John Doe"></div><div><label>Phone</label><input id="vcPhone" value="+1234567890"></div></div>
        <div class="row"><div><label>Email</label><input id="vcEmail" value="john@example.com"></div></div>
        <button id="vcGen">?? Generate vCard QR</button><div id="vcCanvasContainer" style="text-align:center;margin:10px 0;"></div><button class="outline-btn" id="vcDownload">?? Download</button>`;
            c.querySelector('#vcGen').addEventListener('click', () => { const vcard =
                    `BEGIN:VCARD\nVERSION:3.0\nFN:${c.querySelector('#vcName').value}\nTEL:${c.querySelector('#vcPhone').value}\nEMAIL:${c.querySelector('#vcEmail').value}\nEND:VCARD`;
                const container = c.querySelector('#vcCanvasContainer');
                container.innerHTML = '<canvas id="vcCanvas"></canvas>';
                QRCode.toCanvas(c.querySelector('#vcCanvas'), vcard, { width: 256, color: { dark: '#000000',
                        light: '#ffffff' } }); });
            c.querySelector('#vcDownload').addEventListener('click', () => { const canvas = c.querySelector(
                '#vcCanvas'); if (!canvas) return; const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = 'vcard-qr.png';
                a.click(); });
        }

        function wifiQrTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>SSID</label><input id="wfSSID" value="MyWiFi"></div><div><label>Password</label><input id="wfPass" value="mypassword"></div></div>
        <div class="row"><div><label>Security</label><select id="wfSec"><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">None</option></select></div></div>
        <button id="wfGen">?? Generate WiFi QR</button><div id="wfCanvasContainer" style="text-align:center;margin:10px 0;"></div><button class="outline-btn" id="wfDownload">?? Download</button>`;
            c.querySelector('#wfGen').addEventListener('click', () => { const wifistr =
                    `WIFI:T:${c.querySelector('#wfSec').value};S:${c.querySelector('#wfSSID').value};P:${c.querySelector('#wfPass').value};;`;
                const container = c.querySelector('#wfCanvasContainer');
                container.innerHTML = '<canvas id="wfCanvas"></canvas>';
                QRCode.toCanvas(c.querySelector('#wfCanvas'), wifistr, { width: 256, color: { dark: '#000000',
                        light: '#ffffff' } }); });
            c.querySelector('#wfDownload').addEventListener('click', () => { const canvas = c.querySelector(
                '#wfCanvas'); if (!canvas) return; const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = 'wifi-qr.png';
                a.click(); });
        }

        function promptLibraryTool(c) {
            const library = [
                { title: 'Code Explainer',
                    prompt: 'Explain this code in simple terms:\n```\n{code}\n```\nFocus on: {focus}' },
                { title: 'Email Writer', prompt: 'Write a {tone} email about:\n{topic}\nTo: {recipient}' },
                { title: 'Bug Fixer',
                    prompt: 'Find and fix bugs in this code:\n```\n{code}\n```\nError: {error}' },
            ];
            c.innerHTML =
                `<div id="plList" style="max-height:350px;overflow-y:auto;">${library.map(p=>`<div class="prompt-template-card" data-prompt="${p.prompt.replace(/"/g,'&quot;')}"><h4>${p.title}</h4><div class="prompt-preview">${p.prompt.slice(0,60)}...</div></div>`).join('')}</div>
        <div class="output-box" id="plOutput" style="min-height:80px;">Select a prompt...</div><button class="outline-btn" id="plCopy">?? Copy</button>`;
            c.querySelectorAll('#plList .prompt-template-card').forEach(card => card.addEventListener('click', () => { const
                p = card.dataset.prompt.replace(/&quot;/g, '"');
                c.querySelector('#plOutput').textContent = p; }));
            c.querySelector('#plCopy').addEventListener('click', () => copyText(c.querySelector('#plOutput')
            .textContent));
        }

        function chatTemplateTool(c) {
            c.innerHTML =
                `<label>System Prompt</label><textarea id="ctSystem">You are a helpful assistant.</textarea>
        <label>User Message</label><textarea id="ctUser">Hello!</textarea>
        <div class="output-box" id="ctOutput" style="min-height:80px;"></div><button class="outline-btn" id="ctCopy">?? Copy</button>`;
            const update = () => { c.querySelector('#ctOutput').textContent = JSON.stringify([{ role: 'system',
                    content: c.querySelector('#ctSystem').value }, { role: 'user', content: c.querySelector(
                        '#ctUser').value }], null, 2); };
            ['ctSystem', 'ctUser'].forEach(id => c.querySelector('#' + id).addEventListener('input', update));
            c.querySelector('#ctCopy').addEventListener('click', () => copyText(c.querySelector('#ctOutput')
            .textContent));
            update();
        }

        function httpStatusTool(c) {
            const codes = { 200: 'OK', 201: 'Created', 301: 'Moved Permanently', 302: 'Found', 400: 'Bad Request',
                401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 500: 'Internal Server Error',
                502: 'Bad Gateway', 503: 'Service Unavailable' };
            c.innerHTML =
                `<input id="hsSearch" placeholder="Search status code..." style="margin-bottom:10px;"><div class="output-box" id="hsOutput" style="max-height:400px;overflow-y:auto;">${Object.entries(codes).map(([k,v])=>`${k}: ${v}`).join('\n')}</div>`;
            c.querySelector('#hsSearch').addEventListener('input', function() { const q = this.value.toLowerCase();
                c.querySelector('#hsOutput').textContent = Object.entries(codes).filter(([k, v]) => (k + v)
                    .toLowerCase().includes(q)).map(([k, v]) => `${k}: ${v}`).join('\n') || 'No matches.'; });
        }

        function dnsLookupTool(c) {
            c.innerHTML =
                `<label>Domain</label><input id="dnsDomain" value="google.com"><button id="dnsLookup">?? Lookup</button>
        <div class="output-box" id="dnsOutput" style="min-height:100px;"></div>`;
            c.querySelector('#dnsLookup').addEventListener('click', async () => { const domain = c.querySelector(
                    '#dnsDomain').value.trim(); const out = c.querySelector('#dnsOutput');
                out.textContent = '? Looking up...'; try { const res = await fetch(
                    `https://dns.google/resolve?name=${domain}&type=A`);
                    const data = await res.json(); if (data.Answer) { out.textContent = data.Answer.map(a =>
                        `${a.name} ? ${a.data} (TTL: ${a.TTL})`).join('\n'); } else { out.textContent =
                        'No A records found.'; } } catch (e) { out.textContent = '? DNS lookup failed.'; } });
        }

        function whoisLookupTool(c) {
            c.innerHTML =
                `<label>Domain</label><input id="whoisDomain" value="example.com"><button id="whoisLookup">??? Lookup</button>
        <div class="output-box" id="whoisOutput" style="min-height:100px;"></div><p style="font-size:0.7rem;color:#666;">Uses whois.freeaiapi.xyz public API</p>`;
            c.querySelector('#whoisLookup').addEventListener('click', async () => { const domain = c.querySelector(
                    '#whoisDomain').value.trim(); const out = c.querySelector('#whoisOutput');
                out.textContent = '? Fetching...'; try { const res = await fetch(
                    `https://whois.freeaiapi.xyz/?domain=${domain}&format=json`);
                    const data = await res.json();
                out.textContent = JSON.stringify(data, null, 2).slice(0, 2000); } catch (e) { out.textContent =
                        '? WHOIS lookup failed. Try a different domain.'; } });
        }

        function urlParserTool(c) {
            c.innerHTML =
                `<label>URL</label><input id="upUrl" value="https://user:pass@example.com:8080/path?q=1#hash">
        <button id="upParse">?? Parse</button><div class="output-box" id="upOutput" style="min-height:120px;"></div>`;
            c.querySelector('#upParse').addEventListener('click', () => { try { const url = new URL(c.querySelector(
                        '#upUrl').value);
                    c.querySelector('#upOutput').textContent = `Protocol: ${url.protocol}\nHost: ${url.host}\nHostname: ${url.hostname}\nPort: ${url.port||'(default)'}\nPath: ${url.pathname}\nQuery: ${url.search}\nHash: ${url.hash}\nOrigin: ${url.origin}`; } catch (
                    e) { c.querySelector('#upOutput').textContent = '? Invalid URL'; } });
            c.querySelector('#upParse').click();
        }

        function userAgentTool(c) {
            c.innerHTML =
                `<div class="output-box" style="min-height:100px;">??? Your User Agent:\n\n${navigator.userAgent}\n\nPlatform: ${navigator.platform}\nLanguage: ${navigator.language}\nCookies: ${navigator.cookieEnabled?'Enabled':'Disabled'}</div>
        <button class="outline-btn" id="uaCopy">?? Copy</button>`;
            c.querySelector('#uaCopy').addEventListener('click', () => copyText(c.querySelector('.output-box')
            .textContent));
        }

        function ageCalcTool(c) {
            c.innerHTML =
                `<label>Birth Date</label><input type="date" id="acDate"><button id="acCalc">?? Calculate Age</button>
        <div class="result-badge" id="acResult">--</div>`;
            c.querySelector('#acCalc').addEventListener('click', () => { const bd = new Date(c.querySelector('#acDate')
                    .value); const now = new Date(); let years = now.getFullYear() - bd.getFullYear(); const m = now
                    .getMonth() - bd.getMonth(); if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) years--;
                c.querySelector('#acResult').textContent = years + ' years old'; });
        }

        function bmiCalcTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Weight (kg)</label><input type="number" id="bmiWeight" value="70"></div><div><label>Height (cm)</label><input type="number" id="bmiHeight" value="170"></div></div>
        <button id="bmiCalc">?? Calculate BMI</button><div class="result-badge" id="bmiResult">--</div>`;
            c.querySelector('#bmiCalc').addEventListener('click', () => { const w = parseFloat(c.querySelector(
                    '#bmiWeight').value); const h = parseFloat(c.querySelector('#bmiHeight').value) / 100; const bmi =
                    w / (h * h); const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' :
                    'Obese';
                c.querySelector('#bmiResult').textContent = `BMI: ${bmi.toFixed(1)} (${cat})`; });
        }

        function randomNumTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Min</label><input type="number" id="rnMin" value="1"></div><div><label>Max</label><input type="number" id="rnMax" value="100"></div><div><label>Count</label><input type="number" id="rnCount" value="5" min="1" max="50"></div></div>
        <button id="rnGen">?? Generate</button><div class="output-box" id="rnOutput"></div><button class="outline-btn" id="rnCopy">?? Copy</button>`;
            c.querySelector('#rnGen').addEventListener('click', () => { const min = parseInt(c.querySelector('#rnMin')
                    .value); const max = parseInt(c.querySelector('#rnMax').value); const count = parseInt(c
                    .querySelector('#rnCount').value); const nums = []; for (let i = 0; i < count; i++) nums.push(
                    Math.floor(Math.random() * (max - min + 1)) + min);
                c.querySelector('#rnOutput').textContent = nums.join(', '); });
            c.querySelector('#rnCopy').addEventListener('click', () => copyText(c.querySelector('#rnOutput').textContent));
            c.querySelector('#rnGen').click();
        }

        function coinFlipTool(c) {
            c.innerHTML =
                `<div style="font-size:6rem;text-align:center;padding:30px;" id="cfCoin">??</div>
        <button id="cfFlip">?? Flip Coin</button><div class="speed-metric"><div class="val" id="cfResult">--</div></div>`;
            c.querySelector('#cfFlip').addEventListener('click', () => { const r = Math.random() < 0.5 ? 'Heads' :
                    'Tails';
                c.querySelector('#cfCoin').textContent = r === 'Heads' ? '??' : '??';
                c.querySelector('#cfResult').textContent = r; });
        }

        function diceRollerTool(c) {
            c.innerHTML =
                `<div style="font-size:5rem;text-align:center;padding:20px;" id="drDice">??</div>
        <div class="row"><div><label>Sides</label><select id="drSides"><option value="6">D6</option><option value="20">D20</option></select></div><div><label>Count</label><input type="number" id="drCount" value="2" min="1" max="20"></div></div>
        <button id="drRoll">?? Roll</button><div class="result-badge" id="drResult">--</div>`;
            c.querySelector('#drRoll').addEventListener('click', () => { const sides = parseInt(c.querySelector(
                    '#drSides').value); const count = parseInt(c.querySelector('#drCount').value); const rolls = [];
                for (let i = 0; i < count; i++) rolls.push(Math.floor(Math.random() * sides) + 1);
                c.querySelector('#drDice').textContent = '??';
                c.querySelector('#drResult').textContent = rolls.join(' + ') + ' = ' + rolls.reduce((a, b) => a + b,
                    0); });
        }

        function percentCalcTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Value</label><input type="number" id="pcVal" value="50"></div><div><label>Total</label><input type="number" id="pcTotal" value="200"></div></div>
        <button id="pcCalc">?? Calculate</button><div class="result-badge" id="pcResult">--</div>`;
            c.querySelector('#pcCalc').addEventListener('click', () => { const v = parseFloat(c.querySelector('#pcVal')
                    .value); const t = parseFloat(c.querySelector('#pcTotal').value);
                c.querySelector('#pcResult').textContent = `${v} is ${((v/t)*100).toFixed(1)}% of ${t}`; });
        }

        function loanCalcTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Loan Amount</label><input type="number" id="lcAmt" value="100000"></div><div><label>Interest Rate (%)</label><input type="number" id="lcRate" value="5"></div><div><label>Term (years)</label><input type="number" id="lcTerm" value="20"></div></div>
        <button id="lcCalc">?? Calculate EMI</button><div class="result-badge" id="lcResult">--</div>`;
            c.querySelector('#lcCalc').addEventListener('click', () => { const P = parseFloat(c.querySelector('#lcAmt')
                    .value); const r = parseFloat(c.querySelector('#lcRate').value) / 100 / 12; const n = parseFloat(c
                    .querySelector('#lcTerm').value) * 12; const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) -
                    1);
                c.querySelector('#lcResult').textContent = `Monthly EMI: ${emi.toFixed(2)}`; });
        }

        function timezoneConvTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Date/Time</label><input type="datetime-local" id="tzDate"></div></div>
        <div class="row"><div><label>From TZ</label><select id="tzFrom"><option value="UTC">UTC</option><option value="America/New_York">NY (EST)</option><option value="Europe/London">London</option><option value="Asia/Tokyo">Tokyo</option></select></div><div class="swap-icon" id="tzSwap">??</div><div><label>To TZ</label><select id="tzTo"><option value="America/New_York">NY (EST)</option><option value="UTC">UTC</option><option value="Europe/London">London</option><option value="Asia/Tokyo">Tokyo</option></select></div></div>
        <div class="result-badge" id="tzResult">--</div>`;
            const update = () => { const val = c.querySelector('#tzDate').value; if (!val) return; const d = new Date(
                    val); const from = c.querySelector('#tzFrom').value; const to = c.querySelector('#tzTo').value; try {
                    const opts = { timeZone: to, dateStyle: 'full', timeStyle: 'long' };
                    c.querySelector('#tzResult').textContent = new Intl.DateTimeFormat('en-US', opts).format(d); } catch (
                    e) { c.querySelector('#tzResult').textContent = '? Conversion error'; } };
            ['tzDate', 'tzFrom', 'tzTo'].forEach(id => c.querySelector('#' + id).addEventListener('change', update));
            c.querySelector('#tzSwap').addEventListener('click', () => { const t = c.querySelector('#tzFrom').value;
                c.querySelector('#tzFrom').value = c.querySelector('#tzTo').value;
                c.querySelector('#tzTo').value = t;
                update(); });
            c.querySelector('#tzDate').value = new Date().toISOString().slice(0, 16);
            update();
        }

        function json2csvTool(c) {
            c.innerHTML =
                `<label>JSON Input</label><textarea id="j2cInput">[{"name":"Alice","age":30},{"name":"Bob","age":25}]</textarea>
        <button id="j2cConvert">?? Convert to CSV</button><div class="output-box" id="j2cOutput"></div><button class="outline-btn" id="j2cCopy">?? Copy</button>`;
            c.querySelector('#j2cConvert').addEventListener('click', () => { try { const arr = JSON.parse(c.querySelector(
                        '#j2cInput').value); if (!arr.length) return; const headers = Object.keys(arr[0]); const csv = [
                        headers.join(','), ...arr.map(obj => headers.map(h => JSON.stringify(obj[h] ?? '')).join(
                            ','))
                    ].join('\n');
                    c.querySelector('#j2cOutput').textContent = csv; } catch (e) { c.querySelector('#j2cOutput')
                    .textContent = '? Invalid JSON'; } });
            c.querySelector('#j2cCopy').addEventListener('click', () => copyText(c.querySelector('#j2cOutput')
            .textContent));
            c.querySelector('#j2cConvert').click();
        }

        function xml2jsonTool(c) {
            c.innerHTML =
                `<label>XML Input</label><textarea id="x2jInput"><root><name>John</name><age>30</age></root></textarea>
        <button id="x2jConvert">?? Convert to JSON</button><div class="output-box" id="x2jOutput"></div><button class="outline-btn" id="x2jCopy">?? Copy</button>
        <p style="font-size:0.7rem;color:#888;">Basic XML?JSON conversion</p>`;
            c.querySelector('#x2jConvert').addEventListener('click', () => { try { const xml = c.querySelector(
                        '#x2jInput').value; const parser = new DOMParser(); const doc = parser.parseFromString(
                        xml, 'text/xml'); if (doc.querySelector('parsererror')) throw new Error();

                    function xmlToObj(el) { const obj = {}; if (el.children.length === 0) return el.textContent;
                        for (const child of el.children) { const key = child.tagName; if (obj[key]) { if (!Array
                                .isArray(obj[key])) obj[key] = [obj[key]];
                            obj[key].push(xmlToObj(child)); } else obj[key] = xmlToObj(child); } return obj; }
                    const result = xmlToObj(doc.documentElement);
                    c.querySelector('#x2jOutput').textContent = JSON.stringify(result, null, 2); } catch (e) { c
                        .querySelector('#x2jOutput').textContent = '? Invalid XML'; } });
            c.querySelector('#x2jCopy').addEventListener('click', () => copyText(c.querySelector('#x2jOutput')
            .textContent));
            c.querySelector('#x2jConvert').click();
        }

        function mdTableTool(c) {
            c.innerHTML =
                `<div class="row"><div><label>Columns (comma-separated)</label><input id="mdtCols" value="Name,Age,City"></div><div><label>Rows (one per line, comma-separated)</label><textarea id="mdtRows">Alice,30,NYC\nBob,25,LA</textarea></div></div>
        <button id="mdtGen">?? Generate Table</button><div class="output-box" id="mdtOutput"></div><button class="outline-btn" id="mdtCopy">?? Copy</button>`;
            c.querySelector('#mdtGen').addEventListener('click', () => { const cols = c.querySelector('#mdtCols').value
                    .split(',').map(c => c.trim()); const rows = c.querySelector('#mdtRows').value.split('\n').map(r => r
                    .split(',').map(c => c.trim())); const sep = '| ' + cols.map(() => '---').join(' | ') + ' |'; const
                    header = '| ' + cols.join(' | ') + ' |'; const body = rows.map(r => '| ' + r.join(' | ') + ' |').join(
                        '\n');
                c.querySelector('#mdtOutput').textContent = header + '\n' + sep + '\n' + body; });
            c.querySelector('#mdtCopy').addEventListener('click', () => copyText(c.querySelector('#mdtOutput')
            .textContent));
            c.querySelector('#mdtGen').click();
        }

        // Preserve original render functions
        const _renderCategory = renderCategory;
        renderCategory = function(catId) { _renderCategory(catId);
            updateFloatingTimer(); };
        const _renderHome = renderHome;
        renderHome = function() { _renderHome();
            updateFloatingTimer(); };
        const _renderTool = renderTool;
        renderTool = function(catId, toolId) { _renderTool(catId, toolId);
            updateFloatingTimer(); };

        renderHome();
