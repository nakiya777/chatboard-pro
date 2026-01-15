/**
 * プロジェクト一覧コンポーネント
 */
import React from 'react';
import { FolderOpen, Plus, Trash2, Users, Calendar } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  createdAt: any;
}

interface ProjectListProps {
  projects: Project[];
  currentUserId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  selectedProjectId?: string | null;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  currentUserId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  selectedProjectId
}) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <div className="h-full flex flex-col bg-[#e6e9ef]">
      {/* ヘッダー */}
      <div className="p-6 border-b border-white/20 flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-700 flex items-center gap-2">
          <FolderOpen size={20} className="text-indigo-600" />
          プロジェクト
        </h2>
        <button
          onClick={onCreateProject}
          className="p-3 rounded-xl bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* プロジェクト一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-sm">
              プロジェクトがありません
            </p>
            <button
              onClick={onCreateProject}
              className="mt-4 px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg"
            >
              最初のプロジェクトを作成
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`p-4 rounded-2xl cursor-pointer transition-all group ${
                selectedProjectId === project.id
                  ? 'shadow-[inset_6px_6px_12px_#b8bec9,inset_-6px_-6px_12px_#ffffff]'
                  : 'shadow-[4px_4px_8px_#b8bec9,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#b8bec9,-2px_-2px_4px_#ffffff]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-sm truncate ${
                    selectedProjectId === project.id ? 'text-indigo-600' : 'text-slate-700'
                  }`}>
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users size={10} />
                      {project.memberIds.length}名
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {formatDate(project.createdAt)}
                    </span>
                  </div>
                </div>
                {project.ownerId === currentUserId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project.id);
                    }}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectList;
