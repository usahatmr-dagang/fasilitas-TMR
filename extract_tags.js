import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import path from 'path';

try {
    const content = fs.readFileSync(path.resolve('./src/Perjanjian Kerja Sama.docx'), 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });
    
    // Attempt to parse to see what tags are expected, or just extract raw text to find {} tags.
    // Actually Docxtemplater has a way to get variables
    const text = doc.getFullText();
    console.log("Raw text with tags:", text);

} catch (e) {
    console.error(e);
}
