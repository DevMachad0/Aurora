const fs = require('fs');
const path = require('path');
const Terser = require('terser');
const cssnano = require('cssnano');
const postcss = require('postcss');

const inputDir = path.join(__dirname, 'public');

// Função para minificar CSS
const minifyCSS = async (filePath) => {
    const css = fs.readFileSync(filePath, 'utf8');
    const result = await postcss([cssnano]).process(css, { from: filePath, to: filePath });
    // Sobrescrever o arquivo original com o conteúdo minificado
    fs.writeFileSync(filePath, result.css);
};

// Função para minificar JS
const minifyJS = async (filePath) => {
    const js = fs.readFileSync(filePath, 'utf8');
    try {
        const result = await Terser.minify(js);
        if (result.error) {
            console.error(`Error minifying ${filePath}:`, result.error);
            return;
        }
        if (result.code && result.code.trim()) {
            // Sobrescrever o arquivo original com o código minificado
            fs.writeFileSync(filePath, result.code);
        } else {
            console.error(`No code generated for ${filePath}`);
        }
    } catch (err) {
        console.error(`Error during Terser minification for ${filePath}:`, err);
    }
};

// Função recursiva para processar arquivos dentro das pastas "styles" e "scripts"
const processFiles = (dir) => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            processFiles(filePath); // Chama a função recursivamente para subdiretórios
        } else if (file.endsWith('.css') && dir.includes('styles')) {
            minifyCSS(filePath); // Minifica arquivos CSS dentro da pasta "styles"
        } else if (file.endsWith('.js') && dir.includes('scripts')) {
            minifyJS(filePath); // Minifica arquivos JS dentro da pasta "scripts"
        }
    });
};

// Processar arquivos dentro das pastas "styles" e "scripts" diretamente em "public"
processFiles(path.join(inputDir, 'styles'));
processFiles(path.join(inputDir, 'scripts'));

console.log('Minification complete.');
