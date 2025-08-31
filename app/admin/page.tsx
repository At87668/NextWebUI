'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import '@/i18n/index';

type Model = {
  id: string;
  api_id: string;
  name: string;
  description: string | null;
  default_prompt: string | null;
  max_token: number | null;
  type: 'openai' | 'ollama';
  api_base_url: string | null;
  api_key: string | null;
};

type Group = {
  group: string;
  models: string[];
  max_message_per_day: number | null;
  default_model: string;
};

export default function AdminPanel() {
  const { t } = useTranslation();
  const [models, setModels] = useState<Model[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'models' | 'groups'>('models');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved === 'dark' || (!saved && prefersDark);
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [modelsRes, groupsRes] = await Promise.all([
          fetch('/api/admin/models').then(r => r.json()),
          fetch('/api/admin/groups').then(r => r.json()),
        ]);
        setModels(modelsRes);
        setGroups(groupsRes);
      } catch (err) {
        setError(t('admin_panel.error.failed_to_load'));
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, []);

  if (loading) return <div className="p-6">{t('admin_panel.loading')}</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors duration-200">
      <aside
        className={`${isSidebarOpen ? 'w-64' : 'w-16'
          } bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out`}
      >
        <div className="p-4 border-b border-border flex items-center">
          <div className="flex items-center">
            {isSidebarOpen ? (
              <h1 className="text-xl font-bold">{t('admin_panel.title')}</h1>
            ) : (
              <></>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="ml-auto p-1 rounded hover:bg-accent hover:text-accent-foreground"
            aria-label={isSidebarOpen ? t('admin_panel.siderbar.close') : t('admin_panel.siderbar.open')}
          >
            {isSidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <button
                type="button"
                onClick={() => setActiveTab('models')}
                className={`w-full flex items-center rounded-lg transition-all duration-200 ${activeTab === 'models'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  } ${isSidebarOpen
                    ? 'justify-start px-4 py-2 gap-3'
                    : 'justify-center py-2 h-10'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                {isSidebarOpen && <span className="text-sm font-medium">{t('admin_panel.sub.model.title')}</span>}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setActiveTab('groups')}
                className={`w-full flex items-center rounded-lg transition-all duration-200 ${activeTab === 'groups'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  } ${isSidebarOpen
                    ? 'justify-start px-4 py-2 gap-3'
                    : 'justify-center py-2 h-10'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
                {isSidebarOpen && <span className="text-sm font-medium">{t('admin_panel.sub.group.title')}</span>}
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4 flex items-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center text-foreground hover:text-foreground/80 transition"
            aria-label={t('admin_panel.back.label')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 111.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            {t('admin_panel.back.button')}
          </button>
          <h2 className="ml-4 text-lg font-medium">
            {activeTab === 'models' ? t('admin_panel.sub.model.title') : t('admin_panel.sub.group.title')}
          </h2>
          <button
            type="button"
            onClick={toggleTheme}
            className="ml-auto p-2 rounded-full bg-accent text-accent-foreground hover:bg-accent/80 transition"
            aria-label={isDark ? t('admin_panel.theme.to_light') : t('admin_panel.theme.to_dark')}
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {activeTab === 'models' && (
            <ModelManagement models={models} setModels={setModels} />
          )}
          {activeTab === 'groups' && (
            <GroupManagement groups={groups} setGroups={setGroups} availableModels={models.map(m => m.id)} />
          )}
        </main>
      </div>
    </div>
  );
}

function ModelManagement({ models, setModels }: { models: Model[]; setModels: (models: Model[]) => void }) {
  const { t } = useTranslation();
  const [newModel, setNewModel] = useState<Partial<Model>>({
    type: 'openai',
    max_token: null,
  });

  const [editingModel, setEditingModel] = useState<Model | null>(null);

  const addModel = async () => {
    if (!newModel.id || !newModel.name) {
      toast.warning(t('admin.model_manage.warn.missing_parameter'));
      return;
    }

    const model: Model = {
      id: newModel.id as string,
      name: newModel.name as string,
      description: newModel.description || null,
      default_prompt: newModel.default_prompt || null,
      max_token: newModel.max_token || null,
      type: newModel.type || 'openai',
      api_base_url: newModel.api_base_url || null,
      api_key: newModel.type === 'ollama' ? null : (newModel.api_key || null),
      api_id: newModel.api_id ?? '',
    };

    try {
      const res = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model),
      });
      if (!res.ok) throw new Error(t('admin.model_manage.add_model.fail'));
      const saved = await res.json();
      setModels([...models, saved]);
      setNewModel({ type: 'openai', max_token: null });
      toast.success(t('admin.model_manage.add_model.success'));
    } catch (err) {
      toast.error(`${t('admin.model_manage.add_model.fail')}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const startEdit = (model: Model) => {
    setEditingModel({
      ...model,
      description: model.description ?? '',
      default_prompt: model.default_prompt ?? '',
      api_base_url: model.api_base_url ?? '',
      api_key: model.api_key ?? '',
      api_id: model.api_id ?? '',
    });
  };

  const saveEdit = async () => {
    if (!editingModel) return;
    if (!editingModel.name) {
      toast.warning(t('admin.model_manage.warn.null_name'));
      return;
    }

    const originalId = editingModel.id;

    if (
      ['title-model', 'artifact-model'].includes(originalId) &&
      editingModel.id !== originalId
    ) {
      toast.error(`${t('admin.model_manage.system_model')} "${originalId}" ${t('admin.model_manage.id_cant_modify')}`);
      return;
    }

    if (editingModel.type === 'ollama') {
      editingModel.api_key = null;
    }

    const payload = {
      ...editingModel,
      description: editingModel.description || null,
      default_prompt: editingModel.default_prompt || null,
      api_base_url: editingModel.api_base_url || null,
      api_key: editingModel.api_key || null,
      api_id: editingModel.api_id || null,
    };

    try {
      const res = await fetch(`/api/admin/models/${encodeURIComponent(originalId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(t('admin.model_manage.update_model.fail'));
      const updated = await res.json();
      setModels(models.map(m => (m.id === updated.id ? updated : m)));
      setEditingModel(null);
      toast.success(t('admin.model_manage.update_model.success'));
    } catch (err) {
      toast.error(`${t('admin.model_manage.update_model.fail')}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const deleteModel = async (id: string) => {
    if (['title-model', 'artifact-model'].includes(id)) {
      toast.error(`${id} ${t('admin.model_manage.cant_del')}`);
      return;
    }

    if (!confirm(t('admin.model_manage.remove_model.confirm'))) return;
    try {
      const res = await fetch(`/api/admin/models/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(t('admin.model_manage.remove_model.fail'));
      setModels(models.filter(m => m.id !== id));
      toast.success(t('admin.model_manage.remove_model.success'));
    } catch (err) {
      toast.error(`${t('admin.model_manage.remove_model.fail')}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">{t('admin.model_manage.ui.title')}</h2>

      <div className="bg-card border border-border rounded-lg p-6 shadow-sm mb-8">
        <h3 className="text-lg font-medium mb-4">{t('admin.model_manage.ui.add_new')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="new-model-id" className="block text-sm font-medium mb-1">{t('admin.model_manage.ui.internal_id')}</label>
            <input
              id="new-model-id"
              type="text"
              placeholder={t('admin.model_manage.ui.id_example')}
              className="w-full border border-input bg-background text-foreground p-2 rounded"
              value={newModel.id || ''}
              onChange={e => setNewModel({ ...newModel, id: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="new-model-api-id" className="block text-sm font-medium mb-1">API ID</label>
            <input
              id="new-model-api-id"
              type="text"
              placeholder={t('admin.model_manage.ui.api_id_example')}
              className="w-full border border-input bg-background text-foreground p-2 rounded"
              value={newModel.api_id || ''}
              onChange={e => setNewModel({ ...newModel, api_id: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="new-model-name" className="block text-sm font-medium mb-1">{t('admin.model_manage.ui.name')}</label>
            <input
              id="new-model-name"
              type="text"
              placeholder={t('admin.model_manage.ui.name_example')}
              className="w-full border border-input bg-background text-foreground p-2 rounded"
              value={newModel.name || ''}
              onChange={e => setNewModel({ ...newModel, name: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="new-model-desc" className="block text-sm font-medium mb-1">{t('admin.model_manage.ui.description')}</label>
            <input
              id="new-model-desc"
              type="text"
              placeholder={t('admin.model_manage.ui.placeholder.description')}
              className="w-full border border-input bg-background text-foreground p-2 rounded"
              value={newModel.description || ''}
              onChange={e => setNewModel({ ...newModel, description: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="new-model-token" className="block text-sm font-medium mb-1">{t('admin.model_manage.ui.max_token')}</label>
            <input
              id="new-model-token"
              type="number"
              placeholder={t('admin.model_manage.ui.max_token_example')}
              className="w-full border border-input bg-background text-foreground p-2 rounded"
              value={newModel.max_token || ''}
              onChange={e => setNewModel({ ...newModel, max_token: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div>
            <label htmlFor="new-model-type" className="block text-sm font-medium mb-1">{t('admin.model_manage.ui.type')}</label>
            <select
              id="new-model-type"
              value={newModel.type}
              onChange={e => setNewModel({ ...newModel, type: e.target.value as any })}
              className="w-full border border-input bg-background text-foreground p-2 rounded"
            >
              <option value="openai">OpenAI</option>
              <option value="ollama">Ollama</option>
            </select>
          </div>
          <div>
            <label htmlFor="new-model-url" className="block text-sm font-medium mb-1">API Base URL</label>
            <input
              id="new-model-url"
              type="text"
              placeholder="https://api.openai.com/v1"
              className="w-full border border-input bg-background text-foreground p-2 rounded"
              value={newModel.api_base_url || ''}
              onChange={e => setNewModel({ ...newModel, api_base_url: e.target.value })}
            />
          </div>
          {newModel.type !== 'ollama' && (
            <div>
              <label htmlFor="new-model-key" className="block text-sm font-medium mb-1">API Key</label>
              <input
                id="new-model-key"
                type="text"
                placeholder="API Key"
                className="w-full border border-input bg-background text-foreground p-2 rounded"
                value={newModel.api_key || ''}
                onChange={e => setNewModel({ ...newModel, api_key: e.target.value })}
              />
            </div>
          )}
          <button
            type="button"
            onClick={addModel}
            className="bg-primary text-primary-foreground py-2 px-4 rounded hover:bg-primary/90 col-span-2 font-medium"
          >
            {t('admin.model_manage.ui.button.add_model')}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-4">{t('admin.model_manage.ui.existing_model')}</h3>
        <ul className="space-y-2">
          {models.map(model => (
            <li key={model.id} className="flex items-center gap-2 p-3 border border-border rounded hover:shadow-sm transition">
              <span className="font-mono text-sm flex-1">
                {model.name}{' '}
                <span className="text-muted-foreground">({model.id})</span>
                {model.api_id && <span className="text-xs text-gray-500 ml-1">→ {model.api_id}</span>}
              </span>
              <button
                type="button"
                onClick={() => startEdit(model)}
                className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
              >
                {t('admin.model_manage.ui.edit')}
              </button>
              <button
                type="button"
                onClick={() => deleteModel(model.id)}
                className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                disabled={['title-model', 'artifact-model'].includes(model.id)}
              >
                {t('admin.model_manage.ui.del')}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {editingModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-lg font-bold mb-4">{t('admin.model_manage.edit_model')}: {editingModel.id}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-model-id" className="block text-sm font-medium mb-1">{t('admin.model_manage.ui.internal_id')}</label>
                <input
                  id="edit-model-id"
                  type="text"
                  className="w-full border border-input bg-background text-foreground p-2 rounded"
                  value={editingModel.id}
                  onChange={e => {
                    if (['title-model', 'artifact-model'].includes(editingModel.id)) {
                      toast.warning(t('admin.model_manage.system_model_id_cant_modify'));
                      return;
                    }
                    setEditingModel({ ...editingModel, id: e.target.value });
                  }}
                  disabled={['title-model', 'artifact-model'].includes(editingModel.id)}
                />
                {['title-model', 'artifact-model'].includes(editingModel.id) && (
                  <p className="text-xs text-muted-foreground mt-1">{t('admin.model_manage.system_model_id_cant_modify')}</p>
                )}
              </div>
              <div>
                <label htmlFor="edit-model-api-id" className="block text-sm font-medium mb-1">API ID</label>
                <input
                  id="edit-model-api-id"
                  type="text"
                  className="w-full border border-input bg-background text-foreground p-2 rounded"
                  value={editingModel.api_id || ''}
                  onChange={e => setEditingModel({ ...editingModel, api_id: e.target.value })}
                  placeholder="gpt-4o-2024-08-06"
                />
              </div>
              <div>
                <label htmlFor="edit-model-name" className="block text-sm font-medium mb-1">{t('admin.model_manage.ui.name')}</label>
                <input
                  id="edit-model-name"
                  type="text"
                  className="w-full border border-input bg-background text-foreground p-2 rounded"
                  value={editingModel.name}
                  onChange={e => setEditingModel({ ...editingModel, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="edit-model-desc" className="block text-sm font-medium mb-1">{t('admin.model_manage.ui.description')}</label>
                <input
                  id="edit-model-desc"
                  type="text"
                  className="w-full border border-input bg-background text-foreground p-2 rounded"
                  value={editingModel.description || ''}
                  onChange={e => setEditingModel({ ...editingModel, description: e.target.value || null })}
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="edit-model-prompt" className="block text-sm font-medium mb-1">{t('admin.model_manage.ui.default_prompt')}</label>
                <input
                  id="edit-model-prompt"
                  type="text"
                  className="w-full border border-input bg-background text-foreground p-2 rounded"
                  value={editingModel.default_prompt || ''}
                  onChange={e => setEditingModel({ ...editingModel, default_prompt: e.target.value || null })}
                />
              </div>
              <div>
                <label htmlFor="edit-model-token" className="block text-sm font-medium mb-1">{t('admin.model_manage.ui.max_token')}</label>
                <input
                  id="edit-model-token"
                  type="number"
                  className="w-full border border-input bg-background text-foreground p-2 rounded"
                  value={editingModel.max_token || ''}
                  onChange={e => setEditingModel({ ...editingModel, max_token: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div>
                <label htmlFor="edit-model-type" className="block text-sm font-medium mb-1">{t('admin.model_manage.ui.type')}</label>
                <select
                  id="edit-model-type"
                  value={editingModel.type}
                  onChange={e => setEditingModel({ ...editingModel, type: e.target.value as any })}
                  className="w-full border border-input bg-background text-foreground p-2 rounded"
                >
                  <option value="openai">OpenAI</option>
                  <option value="ollama">Ollama</option>
                </select>
              </div>
              <div className="col-span-2">
                <label htmlFor="edit-model-url" className="block text-sm font-medium mb-1">API Base URL</label>
                <input
                  id="edit-model-url"
                  type="text"
                  className="w-full border border-input bg-background text-foreground p-2 rounded"
                  value={editingModel.api_base_url || ''}
                  onChange={e => setEditingModel({ ...editingModel, api_base_url: e.target.value || null })}
                />
              </div>
              {editingModel.type !== 'ollama' ? (
                <div className="col-span-2">
                  <label htmlFor="edit-model-key" className="block text-sm font-medium mb-1">API Key</label>
                  <input
                    id="edit-model-key"
                    type="text"
                    className="w-full border border-input bg-background text-foreground p-2 rounded"
                    value={editingModel.api_key || ''}
                    onChange={e => setEditingModel({ ...editingModel, api_key: e.target.value || null })}
                  />
                </div>
              ) : (
                <></>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setEditingModel(null)}
                className="px-4 py-2 border border-input rounded hover:bg-accent hover:text-accent-foreground"
              >
                {t('button.cencel')}
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                {t('button.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupManagement({
  groups,
  setGroups,
  availableModels
}: {
  groups: Group[],
  setGroups: (groups: Group[]) => void,
  availableModels: string[]
}) {
  const { t } = useTranslation();
  const updateGroup = async (name: string, field: keyof Group, value: any) => {
    try {
      const res = await fetch(`/api/admin/groups/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error(t('admin.group_manage.update_group.fail'));
      const updated = await res.json();
      setGroups(groups.map(g => (g.group === name ? updated : g)));
    } catch (err) {
      toast.error(`${t('admin.group_manage.update_group.fail')}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">{t('admin.group_manage.ui.group_permission_management')}</h2>
      <div className="space-y-6">
        {groups.map(group => (
          <div key={group.group} className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">{group.group}</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor={`default-model-${group.group}`} className="block text-sm font-medium mb-1">{t('admin.group_manage.ui.default_model')}</label>
                <select
                  id={`default-model-${group.group}`}
                  value={group.default_model}
                  onChange={e => updateGroup(group.group, 'default_model', e.target.value)}
                  className="w-full border border-input bg-background text-foreground p-2 rounded"
                >
                  {availableModels.map(id => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`max-message-per-day-${group.group}`} className="block text-sm font-medium mb-1">{t('admin.group_manage.ui.max_message_per_day')}</label>
                <input
                  id={`max-message-per-day-${group.group}`}
                  type="number"
                  value={group.max_message_per_day || ''}
                  onChange={e => updateGroup(group.group, 'max_message_per_day', e.target.value ? Number(e.target.value) : null)}
                  className="w-full border border-input bg-background text-foreground p-2 rounded"
                  placeholder={t('admin.group_manage.ui.placeholder.max_message_per_day')}
                />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor={`models-${group.group}`} className="block text-sm font-medium mb-1">{t('admin.group_manage.ui.available_model')}</label>
              <select
                id={`models-${group.group}`}
                multiple
                value={group.models}
                onChange={e => {
                  const selected = Array.from(e.target.selectedOptions, o => o.value);
                  updateGroup(group.group, 'models', selected);
                }}
                className="w-full border border-input bg-background text-foreground p-2 rounded h-32"
              >
                {availableModels.map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-sm text-muted-foreground">
        {t('admin.group_manage.ui.footer')}
      </div>
    </div>
  );
}