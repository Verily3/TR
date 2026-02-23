'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useEffect, useCallback, useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Link2Off,
  Minus,
  RemoveFormatting,
  Check,
  X,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
  danger,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        danger
          ? 'text-red-500 hover:bg-red-50 hover:text-red-700'
          : active
            ? 'bg-red-100 text-red-700'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  className,
  minHeight = 160,
}: RichTextEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-red-600 underline' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none px-4 py-3 outline-none text-sm text-gray-900 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:my-1 [&_ul]:my-2 [&_ol]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-red-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_code]:bg-gray-100 [&_code]:rounded [&_code]:px-1 [&_code]:text-red-600 [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_hr]:border-gray-300',
      },
    },
  });

  // Sync external value changes (e.g. when switching lessons)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [editor, value]);

  // Focus link input when it appears
  useEffect(() => {
    if (showLinkInput) {
      setTimeout(() => linkInputRef.current?.focus(), 0);
    }
  }, [showLinkInput]);

  const openLinkInput = useCallback(() => {
    if (!editor) return;
    const existing = editor.getAttributes('link').href ?? '';
    setLinkUrl(existing);
    setShowLinkInput(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl.trim()) {
      const href = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  }, [editor]);

  const handleLinkKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') applyLink();
    if (e.key === 'Escape') {
      setShowLinkInput(false);
      setLinkUrl('');
    }
  };

  if (!editor) return null;

  const isOnLink = editor.isActive('link');

  return (
    <div
      className={`border border-gray-200 rounded-lg overflow-hidden bg-gray-50 ${className || ''}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-white flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {isOnLink ? (
          <ToolbarButton onClick={removeLink} title="Remove Link" danger>
            <Link2Off className="w-4 h-4" />
          </ToolbarButton>
        ) : (
          <ToolbarButton onClick={openLinkInput} active={showLinkInput} title="Insert Link">
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
        )}
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Clear Formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Inline link input panel */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-blue-50">
          <LinkIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={handleLinkKeyDown}
            placeholder="https://example.com"
            className="flex-1 text-sm bg-transparent outline-none placeholder-blue-300 text-gray-800"
          />
          <button
            type="button"
            onClick={applyLink}
            className="p-1 rounded text-green-600 hover:bg-green-100 transition-colors"
            title="Set link"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl('');
            }}
            className="p-1 rounded text-gray-400 hover:bg-gray-200 transition-colors"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} style={{ minHeight }} />
    </div>
  );
}
