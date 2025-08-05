'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  LinkIcon,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useThemeClasses } from '@/hooks/useThemeClasses';

interface RichTextEditorProps {
  value?: string; // controlled value
  onChange?: (content: string) => void;
  className?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value = '',
  onChange,
  className = '',
  disabled = false,
}: RichTextEditorProps) {
  const { getProfileInputClass } = useThemeClasses();
  const [linkUrl, setLinkUrl] = useState('');
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [currentLink, setCurrentLink] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4 text-gray-900 dark:text-white',
      },
      handleKeyDown(_, event) {
        // Prevent event bubbling for ctrl/cmd + b, i, u, etc. to avoid sidebar toggle
        if ((event.ctrlKey || event.metaKey) && ['b', 'i', 'u'].includes(event.key.toLowerCase())) {
          event.stopPropagation();
        }
        return false;
      },
    },
  });

  // Sync editor content with value prop
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  // Track current link at selection
  useEffect(() => {
    if (!editor) return;
    const updateCurrentLink = () => {
      const attrs = editor.getAttributes('link');
      setCurrentLink(attrs?.href || null);
    };
    editor.on('selectionUpdate', updateCurrentLink);
    // Initial check
    updateCurrentLink();
    return () => {
      editor.off('selectionUpdate', updateCurrentLink);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      // Cập nhật lại currentLink ngay sau khi add
      setCurrentLink(linkUrl);
      setIsLinkDialogOpen(false);
    }
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    setCurrentLink(null); // Clear current link state
  };

  return (
    <div
      className={`border border-gray-200 dark:border-gray-700 rounded w-full bg-white dark:bg-gray-800 ${className}`}
    >
      {/* Toolbar */}
      <div className="border-b border-gray-100 dark:border-gray-600 border-input p-2 flex flex-wrap items-center gap-1 bg-gray-50 dark:bg-gray-700">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || disabled}
          className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || disabled}
          className="text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-gray-300 dark:bg-gray-600" />

        {/* Headings */}
        <Button
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={disabled}
          className={
            editor.isActive('heading', { level: 1 })
              ? ''
              : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
          }
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
          className={
            editor.isActive('heading', { level: 2 })
              ? ''
              : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
          }
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
          className={
            editor.isActive('heading', { level: 3 })
              ? ''
              : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
          }
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-gray-300 dark:bg-gray-600" />

        {/* Text Formatting */}
        <Button
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          className={
            editor.isActive('bold')
              ? ''
              : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
          }
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          className={
            editor.isActive('italic')
              ? ''
              : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
          }
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={disabled}
          className={
            editor.isActive('underline')
              ? ''
              : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
          }
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-gray-300 dark:bg-gray-600" />

        {/* Text Alignment */}
        <Button
          variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          disabled={disabled}
          className={
            editor.isActive({ textAlign: 'left' })
              ? ''
              : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
          }
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          disabled={disabled}
          className={
            editor.isActive({ textAlign: 'center' })
              ? ''
              : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
          }
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          disabled={disabled}
          className={
            editor.isActive({ textAlign: 'right' })
              ? ''
              : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
          }
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          disabled={disabled}
          className={
            editor.isActive({ textAlign: 'justify' })
              ? ''
              : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
          }
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-gray-300 dark:bg-gray-600" />

        {/* Lists */}
        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          className={
            editor.isActive('bulletList')
              ? ''
              : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
          }
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          className={
            editor.isActive('orderedList')
              ? ''
              : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
          }
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-gray-300 dark:bg-gray-600" />

        {/* Link */}
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant={editor.isActive('link') ? 'default' : 'ghost'}
              size="sm"
              disabled={disabled}
              className={
                editor.isActive('link')
                  ? ''
                  : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
              }
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Link</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 items-center">
              <Input
                className={`border rounded px-2 py-1 w-full ${getProfileInputClass()}`}
                placeholder="Enter URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addLink();
                  }
                }}
                disabled={disabled}
              />
              <button
                className="border-2 border-[#24b4fb] bg-[#24b4fb] rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-[#0071e2] flex items-center justify-center gap-2"
                onClick={addLink}
                disabled={disabled}
                type="button"
              >
                Add
              </button>
              {editor.isActive('link') && (
                <button
                  className="border-2 border-red-500 bg-red-500 rounded-[0.9em] cursor-pointer px-5 py-2 transition-all duration-200 text-[16px] font-semibold text-white hover:bg-white hover:text-red-500 hover:border-red-500"
                  onClick={removeLink}
                  disabled={disabled}
                  type="button"
                >
                  Remove
                </button>
              )}
            </div>
            {currentLink && (
              <div className="mt-2 text-sm text-blue-600 break-all">
                Current link:{' '}
                <a
                  href={currentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {currentLink}
                </a>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Editor Content */}
      <div className="min-h-[200px] bg-white dark:bg-gray-800">
        <EditorContent
          editor={editor}
          className="prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none prose-gray-900 dark:prose-invert"
        />
      </div>
    </div>
  );
}
