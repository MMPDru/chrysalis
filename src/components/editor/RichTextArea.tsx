import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold,
    Italic,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    List,
    ListOrdered,
    Undo,
    Redo
} from 'lucide-react';
import { useEffect } from 'react';

interface RichTextAreaProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    return (
        <div className="editor-menu-bar">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'is-active' : ''}
                title="Bold"
            >
                <Bold size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'is-active' : ''}
                title="Italic"
            >
                <Italic size={18} />
            </button>
            <div className="divider" />
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                title="Heading 1"
            >
                <Heading1 size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                title="Heading 2"
            >
                <Heading2 size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                title="Heading 3"
            >
                <Heading3 size={18} />
            </button>
            <div className="divider" />
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'is-active' : ''}
                title="Bullet List"
            >
                <List size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'is-active' : ''}
                title="Ordered List"
            >
                <ListOrdered size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? 'is-active' : ''}
                title="Blockquote"
            >
                <Quote size={18} />
            </button>
            <div className="divider" />
            <button onClick={() => editor.chain().focus().undo().run()} title="Undo">
                <Undo size={18} />
            </button>
            <button onClick={() => editor.chain().focus().redo().run()} title="Redo">
                <Redo size={18} />
            </button>
        </div>
    );
};

const RichTextArea = ({ content, onChange, placeholder }: RichTextAreaProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: placeholder || 'Begin your story...',
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Handle external content updates (e.g., when loading or switching chapters)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    return (
        <div className="rich-text-editor">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} className="editor-content" />
        </div>
    );
};

export default RichTextArea;
