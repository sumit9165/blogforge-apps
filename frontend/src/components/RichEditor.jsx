import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import './RichEditor.css';

const TOOLBAR_GROUPS = [
  [
    { cmd: 'bold',   icon: 'B',  label: 'Bold',        action: (e) => e.chain().focus().toggleBold().run(),   active: (e) => e.isActive('bold') },
    { cmd: 'italic', icon: 'I',  label: 'Italic',      action: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive('italic') },
    { cmd: 'strike', icon: 'S̶',  label: 'Strikethrough',action: (e) => e.chain().focus().toggleStrike().run(), active: (e) => e.isActive('strike') },
    { cmd: 'code',   icon: '<>', label: 'Inline Code', action: (e) => e.chain().focus().toggleCode().run(),   active: (e) => e.isActive('code') },
  ],
  [
    { cmd: 'h1', icon: 'H1', label: 'Heading 1', action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(), active: (e) => e.isActive('heading', { level: 1 }) },
    { cmd: 'h2', icon: 'H2', label: 'Heading 2', action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), active: (e) => e.isActive('heading', { level: 2 }) },
    { cmd: 'h3', icon: 'H3', label: 'Heading 3', action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), active: (e) => e.isActive('heading', { level: 3 }) },
  ],
  [
    { cmd: 'ul',   icon: '≡', label: 'Bullet List',  action: (e) => e.chain().focus().toggleBulletList().run(),    active: (e) => e.isActive('bulletList') },
    { cmd: 'ol',   icon: '1.', label: 'Ordered List', action: (e) => e.chain().focus().toggleOrderedList().run(),   active: (e) => e.isActive('orderedList') },
    { cmd: 'bq',   icon: '❝', label: 'Blockquote',   action: (e) => e.chain().focus().toggleBlockquote().run(),    active: (e) => e.isActive('blockquote') },
    { cmd: 'pre',  icon: '{}', label: 'Code Block',  action: (e) => e.chain().focus().toggleCodeBlock().run(),     active: (e) => e.isActive('codeBlock') },
  ],
  [
    { cmd: 'hr',    icon: '—', label: 'Divider',    action: (e) => e.chain().focus().setHorizontalRule().run(), active: () => false },
    { cmd: 'undo',  icon: '↩', label: 'Undo',       action: (e) => e.chain().focus().undo().run(),              active: () => false },
    { cmd: 'redo',  icon: '↪', label: 'Redo',       action: (e) => e.chain().focus().redo().run(),              active: () => false },
  ],
];

export default function RichEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder: 'Tell your story…' }),
    ],
    content: content || '',
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'rich-editor__area',
        spellcheck: 'true',
      },
    },
  });

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL:', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  if (!editor) return null;

  return (
    <div className="rich-editor">
      <div className="rich-editor__toolbar">
        {TOOLBAR_GROUPS.map((group, gi) => (
          <div key={gi} className="rich-editor__group">
            {group.map(btn => (
              <button
                key={btn.cmd}
                type="button"
                title={btn.label}
                className={`rich-editor__btn ${btn.active(editor) ? 'rich-editor__btn--active' : ''}`}
                onClick={() => btn.action(editor)}
              >
                {btn.icon}
              </button>
            ))}
            {gi < TOOLBAR_GROUPS.length - 1 && <div className="rich-editor__divider" />}
          </div>
        ))}

        {/* Link button */}
        <div className="rich-editor__group">
          <button
            type="button"
            title="Insert Link"
            className={`rich-editor__btn ${editor.isActive('link') ? 'rich-editor__btn--active' : ''}`}
            onClick={setLink}
          >
            🔗
          </button>
        </div>
      </div>

      <EditorContent editor={editor} className="rich-editor__content" />
    </div>
  );
}
