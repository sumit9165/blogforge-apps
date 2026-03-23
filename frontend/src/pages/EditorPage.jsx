import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import RichEditor from '../components/RichEditor';
import './EditorPage.css';

const AUTOSAVE_DELAY = 3000;

const EMPTY_FORM = {
  title: '',
  content: '',
  excerpt: '',
  cover_image: '',
  tags: '',
  status: 'draft',
};

export default function EditorPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const isEdit     = !!id;

  const [form, setForm]         = useState(EMPTY_FORM);
  const [loading, setLoading]   = useState(isEdit);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [showMeta, setShowMeta] = useState(false);
  const autosaveTimer           = useRef(null);
  const lastSaved               = useRef(null);

  // Load blog for editing
  useEffect(() => {
    if (!isEdit) return;
    api.get(`/my/blogs/${id}`)
      .then(({ data }) => {
        const b = data.blog;
        setForm({
          title: b.title || '',
          content: b.content || '',
          excerpt: b.excerpt || '',
          cover_image: b.cover_image || '',
          tags: Array.isArray(b.tags) ? b.tags.join(', ') : '',
          status: b.status || 'draft',
        });
      })
      .catch(() => { toast.error('Failed to load blog'); navigate('/dashboard'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setContent = (html) => {
    setForm(f => ({ ...f, content: html }));
    const text = html.replace(/<[^>]*>/g, '').trim();
    setWordCount(text ? text.split(/\s+/).length : 0);
    // Trigger autosave
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => autosave({ ...form, content: html }), AUTOSAVE_DELAY);
  };

  const buildPayload = (f) => ({
    ...f,
    tags: f.tags
      ? f.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10)
      : [],
  });

  const autosave = useCallback(async (currentForm) => {
    if (!currentForm.title || !currentForm.content) return;
    if (lastSaved.current === JSON.stringify(currentForm)) return;
    try {
      if (isEdit) {
        await api.put(`/my/blogs/${id}`, buildPayload(currentForm));
      }
      lastSaved.current = JSON.stringify(currentForm);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (_) {}
  }, [id, isEdit]);

  useEffect(() => () => clearTimeout(autosaveTimer.current), []);

  const handleSave = async (statusOverride) => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.content || form.content === '<p></p>') { toast.error('Content is required'); return; }
    setSaving(true);
    try {
      const payload = buildPayload({ ...form, status: statusOverride || form.status });
      let slug;
      if (isEdit) {
        const { data } = await api.put(`/my/blogs/${id}`, payload);
        slug = data.slug;
        toast.success(payload.status === 'published' ? '🎉 Published!' : '✅ Draft saved');
      } else {
        const { data } = await api.post('/my/blogs', payload);
        slug = data.slug;
        toast.success(payload.status === 'published' ? '🎉 Published!' : '✅ Draft saved');
        navigate(`/editor/${data.id}`, { replace: true });
      }
      if (payload.status === 'published' && slug) {
        setTimeout(() => navigate(`/blogs/${slug}`), 800);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.details?.[0]?.msg || 'Save failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div className="editor-page">
      {/* Top Bar */}
      <div className="editor-topbar">
        <div className="editor-topbar__left">
          <Link to="/dashboard" className="btn btn-ghost btn-sm">← Dashboard</Link>
          <span className="editor-topbar__status">
            {saving ? (
              <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
            ) : saved ? (
              <><span className="editor-topbar__dot editor-topbar__dot--saved" /> Saved</>
            ) : (
              <><span className="editor-topbar__dot" /> {isEdit ? 'Editing' : 'New Post'}</>
            )}
          </span>
        </div>
        <div className="editor-topbar__right">
          <span className="editor-topbar__words">{wordCount.toLocaleString()} words</span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowMeta(v => !v)}
          >
            {showMeta ? 'Hide' : 'Post'} Settings
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            Save Draft
          </button>
          <button
            type="button"
            className="btn btn-gold btn-sm"
            onClick={() => handleSave('published')}
            disabled={saving}
          >
            {form.status === 'published' ? 'Update' : 'Publish'} →
          </button>
        </div>
      </div>

      <div className={`editor-layout ${showMeta ? 'editor-layout--split' : ''}`}>
        {/* Main Editor */}
        <div className="editor-main">
          {/* Cover image preview */}
          {form.cover_image && (
            <div className="editor-cover-preview">
              <img src={form.cover_image} alt="Cover" />
              <button className="editor-cover-remove" onClick={() => setForm(f => ({ ...f, cover_image: '' }))}>✕</button>
            </div>
          )}

          {/* Title */}
          <div className="editor-title-wrap">
            <textarea
              className="editor-title"
              placeholder="Your story title…"
              value={form.title}
              onChange={set('title')}
              rows={1}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          </div>

          {/* Excerpt */}
          <textarea
            className="editor-excerpt"
            placeholder="A short excerpt or subtitle (optional)…"
            value={form.excerpt}
            onChange={set('excerpt')}
            rows={2}
            maxLength={500}
          />

          {/* Rich Editor */}
          <div className="editor-body">
            <RichEditor content={form.content} onChange={setContent} />
          </div>
        </div>

        {/* Sidebar / Meta Panel */}
        {showMeta && (
          <aside className="editor-sidebar animate-fade-in">
            <h3 className="editor-sidebar__title">Post Settings</h3>

            <div className="editor-sidebar__section">
              <label className="form-label">Status</label>
              <div className="editor-sidebar__radios">
                {['draft', 'published'].map(s => (
                  <label key={s} className={`editor-sidebar__radio ${form.status === s ? 'editor-sidebar__radio--active' : ''}`}>
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={form.status === s}
                      onChange={set('status')}
                    />
                    <span>{s === 'draft' ? '📝 Draft' : '🌍 Published'}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="editor-sidebar__section">
              <label className="form-label" htmlFor="cover_image">Cover Image URL</label>
              <input
                id="cover_image"
                type="url"
                className="form-input form-input--sm"
                placeholder="https://example.com/image.jpg"
                value={form.cover_image}
                onChange={set('cover_image')}
              />
              {form.cover_image && (
                <div className="editor-sidebar__preview">
                  <img src={form.cover_image} alt="Cover preview" />
                </div>
              )}
            </div>

            <div className="editor-sidebar__section">
              <label className="form-label" htmlFor="tags">Tags</label>
              <input
                id="tags"
                type="text"
                className="form-input form-input--sm"
                placeholder="tech, design, react (comma-separated)"
                value={form.tags}
                onChange={set('tags')}
              />
              <span className="form-hint">Up to 10 tags, comma-separated</span>
              {form.tags && (
                <div className="editor-sidebar__tags">
                  {form.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10).map(t => (
                    <span key={t} className="badge badge-draft">#{t}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="editor-sidebar__section">
              <label className="form-label" htmlFor="excerpt">Excerpt / Subtitle</label>
              <textarea
                id="excerpt"
                className="form-input form-input--sm"
                rows={3}
                placeholder="Short description shown in listings…"
                value={form.excerpt}
                onChange={set('excerpt')}
                maxLength={500}
              />
              <span className="form-hint">{form.excerpt.length}/500 chars</span>
            </div>

            <div className="editor-sidebar__actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => handleSave('draft')}
                disabled={saving}
              >
                Save as Draft
              </button>
              <button
                type="button"
                className="btn btn-gold"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => handleSave('published')}
                disabled={saving}
              >
                {form.status === 'published' ? 'Update Post' : 'Publish Now'} →
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
