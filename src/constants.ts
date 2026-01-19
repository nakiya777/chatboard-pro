import { ColorSystem } from './types';

export const ANNOTATION_COLORS = ['#ffffff', '#3b82f6', '#000000', '#10b981', '#f59e0b', '#ef4444'];

export const THEME_MODES: Record<string, { name: string }> = {
  neumorphism: { name: 'Neu 2.0' },
  claymorphism: { name: 'Clay 3D' },
  glassmorphism: { name: 'Glass' }
};

export const COLOR_SYSTEMS: Record<string, ColorSystem> = {
  standard: { 
    name: 'SaaS Light', 
    base: '#F8FAFC', // Slate 50
    accent: '#4F46E5', // Indigo 600
    shadow: '#CBD5E1', // Slate 300
    highlight: '#FFFFFF',
    text: 'text-slate-900',
    textSecondary: 'text-slate-500'
  },
  midnight: { 
    name: 'Nebula', 
    base: '#0B1120', // Rich Dark Blue
    accent: '#38BDF8', // Sky 400
    shadow: '#020617', // Slate 950
    highlight: '#1E293B', // Slate 800
    text: 'text-white',
    textSecondary: 'text-slate-400'
  },
  natural: { 
    name: 'Sage Forest', 
    base: '#F2FBF7', // Soft Mint
    accent: '#059669', // Emerald 600
    shadow: '#D1FAE5', // Emerald 100
    highlight: '#FFFFFF',
    text: 'text-emerald-950',
    textSecondary: 'text-emerald-700'
  },
  warm: { 
    name: 'Clay Sunset', 
    base: '#FFF5F5', // Rose 50ish
    accent: '#E11D48', // Rose 600
    shadow: '#FECDD3', // Rose 200
    highlight: '#FFFFFF',
    text: 'text-rose-950',
    textSecondary: 'text-rose-700'
  }
};

export const TRANSLATIONS: Record<string, any> = {
  ja: {
    documents: 'プロジェクト', ready: '準備完了', preferences: '設定', visualStyle: 'デザインテーマ', colorTone: 'カラーテーマ', language: '表示言語', apply: '設定を適用', setupDoc: '新規スレッドの作成', editDoc: '情報の修正', docTitleLabel: '名称:', threadSubject: '議論の主題（スレッド名）', initialMsg: '最初のメッセージ内容', selectFile: '図面を選択', changeFile: '変更', useImageLabel: '図面（画像）を使用する', noImageLabel: '図面なし（白紙）で使用', startProject: 'スレッドを開始', updateInfo: '情報を更新', deleteDoc: 'ドキュメントを削除', writeMsg: 'メッセージを入力...', replyTo: '返信先:', discussionStream: '議論ストリーム', globalWorkspace: 'ワークスペース', live: 'ライブ', projectReady: 'プロジェクト準備完了', welcomeMsg: 'まずは右上の「＋」から議論を始めましょう。', addedItem: 'を追加しました', updatedText: 'テキストを更新しました', whiteboard: 'ホワイトボード', toolSelect: '選択', toolArrow: '矢印', toolRect: '矩形', toolCircle: '円', toolStar: '星型', toolText: 'テキスト', toolPencil: '自由線', textPlaceholder: 'ここに入力してください', fontSize: 'サイズ', save: '設定を保存', cancel: 'キャンセル', edit: '編集', delete: '削除', edited: '(編集済)', linkedTo: '箇所とリンク中', cancelLink: '紐付けを解除', editTextTitle: 'テキストの詳細編集',
    // Added for Settings
    account: 'アカウント情報', name: '表示名', organization: '組織名', logout: 'ログアウト', backToProjects: 'プロジェクト一覧に戻る', saved: '保存しました', toolImage: '画像', close: '設定を完了',
    // Added for Setup
    systemSetup: 'システム初期設定',
    setupDescription: 'ワークスペースを開始するには、Firebaseの構成設定（JSON）を入力してください。',
    configNote: '※ 設定情報は利便性のためブラウザ（LocalStorage）に保存されます。',
    connectBtn: '接続して開始',
    disconnectBtn: '接続を解除 / アプリをリセット',
    subjectPlaceholder: '件名を入力',
    discussionStartPlaceholder: '議論の口火を切るメッセージ...',
    invalidJson: 'JSON形式が正しくありません',
    connectionFailed: '接続に失敗しました: ',
    invalidConfig: '設定が無効です'
  },
  en: {
    documents: 'Projects', ready: 'Ready', preferences: 'Preferences', visualStyle: 'Visual Style', colorTone: 'Color Tone', language: 'Language', apply: 'Apply Changes', setupDoc: 'Create New Thread', editDoc: 'Edit Metadata', docTitleLabel: 'Name:', threadSubject: 'Thread Subject', initialMsg: 'Initial Message', selectFile: 'Select Drawing', changeFile: 'Change', useImageLabel: 'Use Drawing (Image)', noImageLabel: 'No Image (Blank)', startProject: 'Start Thread', updateInfo: 'Update Info', deleteDoc: 'Delete Doc', writeMsg: 'Write a message...', replyTo: 'REPLY TO:', discussionStream: 'Discussion Stream', globalWorkspace: 'Workspace', live: 'LIVE', projectReady: 'Project Ready', welcomeMsg: 'Start by clicking "+" in the sidebar.', addedItem: 'added ', updatedText: 'updated text', whiteboard: 'Whiteboard', toolSelect: 'Select', toolArrow: 'Arrow', toolRect: 'Rectangle', toolCircle: 'Circle', toolStar: 'Star', toolText: 'Text Block', toolPencil: 'Pencil', textPlaceholder: 'Type something...', fontSize: 'Size', save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete', edited: '(edited)', linkedTo: 'marks linked', cancelLink: 'Unlink', editTextTitle: 'Rich Text Editor',
    // Added for Settings
    account: 'Account', name: 'Display Name', organization: 'Organization', logout: 'Logout', backToProjects: 'Back to Projects', saved: 'Saved', toolImage: 'Image', close: 'Done',
    // Added for Setup
    systemSetup: 'System Setup',
    setupDescription: 'Please provide your Firebase credentials to initialize the workspace environment.',
    configNote: '* Configuration is stored locally in your browser for convenience.',
    connectBtn: 'Connect & Initialize',
    disconnectBtn: 'Disconnect / Reset App',
    subjectPlaceholder: 'Subject',
    discussionStartPlaceholder: 'Discussion start...',
    invalidJson: 'Invalid JSON format',
    connectionFailed: 'Connection Failed: ',
    invalidConfig: 'Invalid Config'
  }
};