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
  },
  ocean: { 
    name: 'Ocean Breeze', 
    base: '#ECFEFF', // Cyan 50
    accent: '#06B6D4', // Cyan 500
    shadow: '#CFFAFE', // Cyan 100
    highlight: '#FFFFFF',
    text: 'text-cyan-950',
    textSecondary: 'text-cyan-700'
  },
  sunlight: { 
    name: 'Sunny Day', 
    base: '#FEFCE8', // Yellow 50
    accent: '#F59E0B', // Amber 500
    shadow: '#FEF08A', // Yellow 200
    highlight: '#FFFFFF',
    text: 'text-yellow-950',
    textSecondary: 'text-yellow-700'
  }
};

export const TRANSLATIONS: Record<string, any> = {
  ja: {
    documents: 'プロジェクト', ready: '準備完了', preferences: '設定', visualStyle: 'デザインテーマ', colorTone: 'カラーテーマ', language: '表示言語', apply: '設定を適用', setupDoc: '新規スレッドの作成', editDoc: '情報の修正', docTitleLabel: '名称:', threadSubject: '議論の主題（スレッド名）', initialMsg: '最初のメッセージ内容', selectFile: '図面を選択', changeFile: '変更', useImageLabel: '図面（画像）を使用する', noImageLabel: '図面なし（白紙）で使用', startProject: 'スレッドを開始', updateInfo: '情報を更新', deleteDoc: 'ドキュメントを削除', writeMsg: 'メッセージを入力...', replyTo: '返信先:', discussionStream: '議論ストリーム', globalWorkspace: 'ワークスペース', live: 'ライブ', projectReady: 'プロジェクト準備完了', welcomeMsg: 'まずは右上の「＋」から議論を始めましょう。', addedItem: 'を追加しました', updatedText: 'テキストを更新しました', whiteboard: 'ホワイトボード', toolSelect: '選択', toolArrow: '矢印', toolLine: '直線', toolRect: '矩形', toolCircle: '円', toolStar: '星型', toolText: 'テキスト', toolPencil: '自由線', textPlaceholder: 'ここに入力してください', fontSize: 'サイズ', save: '設定を保存', cancel: 'キャンセル', edit: '編集', delete: '削除', edited: '(編集済)', linkedTo: '箇所とリンク中', cancelLink: '紐付けを解除', editTextTitle: 'テキストの詳細編集',
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
    invalidConfig: '設定が無効です',
    // Themes and Colors
    theme_neumorphism: 'ニュー 2.0', theme_claymorphism: 'クレイ 3D', theme_glassmorphism: 'ガラス',
    color_standard: 'SaaS ライト', color_midnight: 'ネビュラ', color_natural: 'セージ・フォレスト', color_warm: 'クレイ・サンセット',
    color_ocean: 'オーシャン・ブリーズ', color_sunlight: 'サニー・デイ',
    // Languages
    lang_ja: '日本語', lang_en: '英語', lang_vi: 'ベトナム語'
  },
  en: {
    documents: 'Projects', ready: 'Ready', preferences: 'Preferences', visualStyle: 'Visual Style', colorTone: 'Color Tone', language: 'Language', apply: 'Apply Changes', setupDoc: 'Create New Thread', editDoc: 'Edit Metadata', docTitleLabel: 'Name:', threadSubject: 'Thread Subject', initialMsg: 'Initial Message', selectFile: 'Select Drawing', changeFile: 'Change', useImageLabel: 'Use Drawing (Image)', noImageLabel: 'No Image (Blank)', startProject: 'Start Thread', updateInfo: 'Update Info', deleteDoc: 'Delete Doc', writeMsg: 'Write a message...', replyTo: 'REPLY TO:', discussionStream: 'Discussion Stream', globalWorkspace: 'Workspace', live: 'LIVE', projectReady: 'Project Ready', welcomeMsg: 'Start by clicking "+" in the sidebar.', addedItem: 'added ', updatedText: 'updated text', whiteboard: 'Whiteboard', toolSelect: 'Select', toolArrow: 'Arrow', toolLine: 'Line', toolRect: 'Rectangle', toolCircle: 'Circle', toolStar: 'Star', toolText: 'Text Block', toolPencil: 'Pencil', textPlaceholder: 'Type something...', fontSize: 'Size', save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete', edited: '(edited)', linkedTo: 'marks linked', cancelLink: 'Unlink', editTextTitle: 'Rich Text Editor',
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
    invalidConfig: 'Invalid Config',
    // Themes and Colors
    theme_neumorphism: 'Neu 2.0', theme_claymorphism: 'Clay 3D', theme_glassmorphism: 'Glass',
    color_standard: 'SaaS Light', color_midnight: 'Nebula', color_natural: 'Sage Forest', color_warm: 'Clay Sunset',
    color_ocean: 'Ocean Breeze', color_sunlight: 'Sunny Day',
    // Languages
    lang_ja: 'Japanese', lang_en: 'English', lang_vi: 'Vietnamese'
  },
  vi: {
    documents: 'Dự án', ready: 'Sẵn sàng', preferences: 'Cài đăt', visualStyle: 'Giao diện', colorTone: 'Màu sắc', language: 'Ngôn ngữ', apply: 'Áp dụng', setupDoc: 'Tạo chủ đề mới', editDoc: 'Chỉnh sửa thông tin', docTitleLabel: 'Tên:', threadSubject: 'Chủ đề thảo luận', initialMsg: 'Tin nhắn đầu tiên', selectFile: 'Chọn bản vẽ', changeFile: 'Thay đổi', useImageLabel: 'Sử dụng bản vẽ (Hình ảnh)', noImageLabel: 'Không dùng ảnh (Trắng)', startProject: 'Bắt đầu', updateInfo: 'Cập nhật', deleteDoc: 'Xóa', writeMsg: 'Nhập tin nhắn...', replyTo: 'Trả lời:', discussionStream: 'Luồng thảo luận', globalWorkspace: 'Không gian làm việc', live: 'TRỰC TIẾP', projectReady: 'Dự án đã sẵn sàng', welcomeMsg: 'Bắt đầu bằng cách nhấn "+" ở thanh bên.', addedItem: 'đã thêm ', updatedText: 'cập nhật văn bản', whiteboard: 'Bảng trắng', toolSelect: 'Chọn', toolArrow: 'Mũi tên', toolLine: 'Đường kẻ', toolRect: 'Hình chữ nhật', toolCircle: 'Hình tròn', toolStar: 'Ngôi sao', toolText: 'Văn bản', toolPencil: 'Bút chì', textPlaceholder: 'Nhập nội dung...', fontSize: 'Kích cỡ', save: 'Lưu', cancel: 'Hủy', edit: 'Sửa', delete: 'Xóa', edited: '(đã sửa)', linkedTo: 'liên kết', cancelLink: 'Hủy liên kết', editTextTitle: 'Trình soạn thảo văn bản',
    // Added for Settings
    account: 'Tài khoản', name: 'Tên hiển thị', organization: 'Tổ chức', logout: 'Đăng xuất', backToProjects: 'Quay lại danh sách', saved: 'Đã lưu', toolImage: 'Hình ảnh', close: 'Hoàn tất',
    // Added for Setup
    systemSetup: 'Thiết lập hệ thống',
    setupDescription: 'Vui lòng cung cấp thông tin cấu hình Firebase để khởi tạo không gian làm việc.',
    configNote: '* Cấu hình được lưu cục bộ trong trình duyệt dể thuận tiện.',
    connectBtn: 'Kết nối & Khởi tạo',
    disconnectBtn: 'Ngắt kết nối / Đặt lại',
    subjectPlaceholder: 'Chủ đề',
    discussionStartPlaceholder: 'Bắt đầu thảo luận...',
    invalidJson: 'Định dạng JSON không hợp lệ',
    connectionFailed: 'Kết nối thất bại: ',
    invalidConfig: 'Cấu hình không hợp lệ',
    // Themes and Colors
    theme_neumorphism: 'Neu 2.0', theme_claymorphism: 'Đất Sét 3D', theme_glassmorphism: 'Kính',
    color_standard: 'SaaS Sáng', color_midnight: 'Tinh Vân', color_natural: 'Rừng Sage', color_warm: 'Hoàng Hôn Đất Sét',
    color_ocean: 'Gió Biển', color_sunlight: 'Ngày Nắng',
    // Languages
    lang_ja: 'Tiếng Nhật', lang_en: 'Tiếng Anh', lang_vi: 'Tiếng Việt'
  }
};