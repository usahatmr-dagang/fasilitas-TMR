import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

try {
    const content = fs.readFileSync('dispensasi.docx', 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '<<', end: '>>' }
    });
    
    const text = doc.getFullText();
    console.log("Raw text with tags:", text);
} catch (e) {
    console.error(e);
}
