
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export interface ChapterExportData {
    chapterNumber: number;
    title: string;
    content: string;
}

export const exportToPDF = async (chapters: ChapterExportData[], options: { includeImages: boolean; includeTOC: boolean; includeTitle: boolean }) => {
    const doc = new jsPDF();
    let y = 20;

    if (options.includeTitle) {
        doc.setFontSize(24);
        doc.text("Chrysalis: My Transformation", 40, 50);
        doc.setFontSize(14);
        doc.text("A Memoir of Growth and Change", 40, 60);
        doc.addPage();
    }

    if (options.includeTOC) {
        doc.setFontSize(18);
        doc.text("Table of Contents", 20, 20);
        y = 40;
        chapters.forEach((chapter, index) => {
            doc.setFontSize(12);
            doc.text(`${index + 1}. ${chapter.title}`, 25, y);
            y += 10;
        });
        doc.addPage();
    }

    chapters.forEach((chapter, index) => {
        doc.setFontSize(18);
        doc.text(`Chapter ${chapter.chapterNumber}: ${chapter.title}`, 20, 20);

        doc.setFontSize(11);
        const splitText = doc.splitTextToSize(chapter.content || "No content yet.", 170);
        doc.text(splitText, 20, 40);

        if (index < chapters.length - 1) {
            doc.addPage();
        }
    });

    doc.save("my-memoir.pdf");
};

export const exportToWord = async (chapters: ChapterExportData[], options: { includeImages: boolean; includeTOC: boolean; includeTitle: boolean }) => {
    const children: Paragraph[] = [];

    if (options.includeTitle) {
        children.push(
            new Paragraph({
                text: "Chrysalis: My Transformation",
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: "A Memoir of Growth and Change",
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            })
        );
    }

    chapters.forEach((chapter) => {
        children.push(
            new Paragraph({
                text: `Chapter ${chapter.chapterNumber}: ${chapter.title}`,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: chapter.content || "No content yet.",
                        size: 24,
                    })
                ]
            })
        );
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: children,
        }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "my-memoir.docx");
};
