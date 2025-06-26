import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';
import { FaBold, FaItalic, FaUnderline, FaLink, FaUndo, FaRedo, FaEraser } from 'react-icons/fa';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const headingOptions = [
  { label: 'Normal', value: 'paragraph' },
  { label: 'H1', value: 'h1' },
  { label: 'H2', value: 'h2' },
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, disabled }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Link,
      Underline,
      CharacterCount.configure({ limit: 1000 }),
    ],
    content: value || '<p></p>',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync editor content with value prop
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  const clearEditor = () => {
    editor?.commands.clearContent();
  };

  // Determine heading select value
  let headingValue = 'paragraph';
  if (editor?.isActive('heading', { level: 1 })) headingValue = 'h1';
  else if (editor?.isActive('heading', { level: 2 })) headingValue = 'h2';

  if (!editor) return null;

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-0 border rounded bg-white p-1 mb-2 shadow-sm">
        {/* Undo/Redo */}
        <button
          type="button"
          disabled={disabled}
          title="Undo"
          className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <FaUndo />
        </button>
        <button
          type="button"
          disabled={disabled}
          title="Redo"
          className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <FaRedo />
        </button>
        <div className="mx-2 h-6 border-l border-gray-200" />
        {/* Heading select */}
        <select
          disabled={disabled}
          className="h-8 px-2 rounded bg-white border border-gray-200 text-xs focus:outline-none"
          value={headingValue}
          title="Heading"
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'h1') editor.chain().focus().setHeading({ level: 1 }).run();
            else if (val === 'h2') editor.chain().focus().setHeading({ level: 2 }).run();
            else editor.chain().focus().setParagraph().run();
          }}
        >
          {headingOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="mx-2 h-6 border-l border-gray-200" />
        {/* Bold, Italic, Underline */}
        <button
          type="button"
          disabled={disabled}
          title="Bold"
          className={`h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50 ${
            editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : ''
          }`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <FaBold />
        </button>
        <button
          type="button"
          disabled={disabled}
          title="Italic"
          className={`h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50 ${
            editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : ''
          }`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <FaItalic />
        </button>
        <button
          type="button"
          disabled={disabled}
          title="Underline"
          className={`h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50 ${
            editor.isActive('underline') ? 'bg-blue-100 text-blue-600' : ''
          }`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <FaUnderline />
        </button>
        <div className="mx-2 h-6 border-l border-gray-200" />
        {/* Font size */}
        <select
          disabled={disabled}
          className="h-8 px-2 rounded bg-white border border-gray-200 text-xs focus:outline-none"
          title="Font size"
          onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
          value={editor.getAttributes('textStyle').fontSize || ''}
        >
          <option value="">Size</option>
          <option value="12px">12</option>
          <option value="16px">16</option>
          <option value="20px">20</option>
          <option value="24px">24</option>
        </select>
        {/* Color */}
        <input
          type="color"
          disabled={disabled}
          className="h-8 w-8 border rounded p-1 ml-1"
          onInput={(e) => editor.chain().focus().setColor(e.currentTarget.value).run()}
          title="Choose text color"
        />
        <div className="mx-2 h-6 border-l border-gray-200" />
        {/* Link */}
        <button
          type="button"
          disabled={disabled}
          title="Link"
          className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50"
          onClick={() => {
            const url = prompt('Input URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
        >
          <FaLink />
        </button>
        <div className="mx-2 h-6 border-l border-gray-200" />
        {/* Clear */}
        <button
          type="button"
          disabled={disabled}
          title="Clear Editor"
          className="h-8 w-16 flex items-center justify-center rounded hover:bg-red-100 disabled:opacity-50"
          onClick={clearEditor}
        >
          <FaEraser /> <span className="ml-1 text-xs">Clear</span>
        </button>
      </div>
      {/* Editor */}
      <div className="border min-h-[150px] p-2 rounded bg-white focus-within:ring-2 focus-within:ring-blue-300 transition">
        <EditorContent editor={editor} />
      </div>
      {/* Character Counter */}
      <div className="text-xs text-gray-500 text-right">
        {editor.storage.characterCount.characters()} ký tự
      </div>
    </div>
  );
};

export default RichTextEditor;
