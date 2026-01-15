import { ColorSystem } from './types';

export const ANNOTATION_COLORS = ['#ffffff', '#3b82f6', '#000000', '#10b981', '#f59e0b', '#ef4444'];

export const THEME_MODES: Record<string, { name: string }> = {
  neumorphism: { name: 'Neu 2.0' },
  claymorphism: { name: 'Clay 3D' },
  glassmorphism: { name: 'Glass' }
};

export const COLOR_SYSTEMS: Record<string, ColorSystem> = {
  standard: { name: 'Standard', base: '#e6e9ef', accent: '#4f46e5', shadow: '#b8bec9', highlight: '#ffffff', text: 'text-slate-800' },
  midnight: { name: 'Midnight', base: '#1e293b', accent: '#38bdf8', shadow: '#0f172a', highlight: '#334155', text: 'text-slate-100' },
  natural: { name: 'Natural', base: '#f0f4f0', accent: '#059669', shadow: '#cbd5cb', highlight: '#ffffff', text: 'text-emerald-950' },
  warm: { name: 'Warm Rose', base: '#fdf2f2', accent: '#e11d48', shadow: '#e5d5d5', highlight: '#ffffff', text: 'text-rose-950' }
};

export const TRANSLATIONS: Record<string, any> = {
  ja: {
    documents: 'プロジェクト', ready: '準備完了', preferences: '表示設定', visualStyle: '質感スタイル', colorTone: '配色系統', language: '表示言語', apply: '設定を適用', setupDoc: '新規スレッドの作成', editDoc: '情報の修正', docTitleLabel: '名称:', threadSubject: '議論の主題（スレッド名）', initialMsg: '最初のメッセージ内容', selectFile: '図面を選択', changeFile: '変更', useImageLabel: '図面（画像）を使用する', noImageLabel: '図面なし（白紙）で使用', startProject: 'スレッドを開始', updateInfo: '情報を更新', deleteDoc: 'ドキュメントを削除', writeMsg: 'メッセージを入力...', replyTo: '返信先:', discussionStream: '議論ストリーム', globalWorkspace: 'ワークスペース', live: 'ライブ', projectReady: 'プロジェクト準備完了', welcomeMsg: 'まずは右上の「＋」から議論を始めましょう。', addedItem: 'を追加しました', updatedText: 'テキストを更新しました', whiteboard: 'ホワイトボード', toolSelect: '選択', toolArrow: '矢印', toolRect: '矩形', toolCircle: '円', toolStar: '星型', toolText: 'テキスト', toolPencil: '自由線', textPlaceholder: 'ここに入力してください', fontSize: 'サイズ', save: '保存', cancel: 'キャンセル', edit: '編集', delete: '削除', edited: '(編集済)', linkedTo: '箇所とリンク中', cancelLink: '紐付けを解除', editTextTitle: 'テキストの詳細編集',
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