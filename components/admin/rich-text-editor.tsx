'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo2,
  Redo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onImageUpload?: (file: File) => Promise<string>
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Напишіть вміст статті...",
  onImageUpload,
}: RichTextEditorProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Color,
      TextStyle,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-96 p-4 border border-gray-300 rounded-lg',
      },
    },
  })

  if (!editor) {
    return null
  }

  const handleImageUpload = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && onImageUpload) {
        try {
          const url = await onImageUpload(file)
          editor.chain().focus().setImage({ src: url }).run()
        } catch (error) {
          console.error('Error uploading image:', error)
        }
      } else if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const url = event.target?.result as string
          editor.chain().focus().setImage({ src: url }).run()
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleLinkAdd = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run()
      setLinkUrl('')
      setIsLinkDialogOpen(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 p-2 bg-gray-100 rounded-lg border border-gray-300">
        {/* Text Formatting */}
        <Button
          size="sm"
          variant={editor.isActive('bold') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Жирний текст"
          className="h-8"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={editor.isActive('italic') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Курсив"
          className="h-8"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px bg-gray-300" />

        {/* Headings */}
        <Button
          size="sm"
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Заголовок 1"
          className="h-8"
        >
          <Heading1 className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Заголовок 2"
          className="h-8"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <div className="w-px bg-gray-300" />

        {/* Lists */}
        <Button
          size="sm"
          variant={editor.isActive('bulletList') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Список"
          className="h-8"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={editor.isActive('orderedList') ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Нумерований список"
          className="h-8"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px bg-gray-300" />

        {/* Alignment */}
        <Button
          size="sm"
          variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="Вирівнювання вліво"
          className="h-8"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="По центру"
          className="h-8"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="Вирівнювання вправо"
          className="h-8"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px bg-gray-300" />

        {/* Media & Links */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleImageUpload}
          title="Вставити зображення"
          className="h-8"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant={editor.isActive('link') ? 'default' : 'outline'}
          onClick={() => setIsLinkDialogOpen(!isLinkDialogOpen)}
          title="Додати посилання"
          className="h-8"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <div className="w-px bg-gray-300" />

        {/* History */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Назад"
          className="h-8"
        >
          <Undo2 className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Вперед"
          className="h-8"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Link Input Dialog */}
      {isLinkDialogOpen && (
        <div className="flex gap-2 p-2 bg-blue-50 rounded-lg border border-blue-300">
          <Input
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLinkAdd()
              }
            }}
          />
          <Button size="sm" onClick={handleLinkAdd}>
            Додати
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsLinkDialogOpen(false)
              setLinkUrl('')
            }}
          >
            Скасувати
          </Button>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}
