export const ipcChannels = {
  connections: {
    list: 'connections:list',
    create: 'connections:create',
    update: 'connections:update',
    delete: 'connections:delete',
    test: 'connections:test'
  },
  buckets: {
    list: 'buckets:list',
    create: 'buckets:create',
    delete: 'buckets:delete'
  },
  objects: {
    list: 'objects:list',
    stat: 'objects:stat',
    delete: 'objects:delete',
    copy: 'objects:copy',
    move: 'objects:move',
    presignUrl: 'objects:presign-url',
    preview: 'objects:preview',
    createFolder: 'objects:create-folder'
  },
  transfers: {
    list: 'transfers:list',
    createUpload: 'transfers:create-upload',
    createDownload: 'transfers:create-download',
    pause: 'transfers:pause',
    resume: 'transfers:resume',
    cancel: 'transfers:cancel',
    retry: 'transfers:retry',
    openLocalFile: 'transfers:open-local-file',
    deleteLocalFile: 'transfers:delete-local-file',
    clearCompleted: 'transfers:clear-completed',
    progress: 'transfers:progress'
  },
  settings: {
    get: 'settings:get',
    set: 'settings:set'
  },
  updates: {
    check: 'updates:check'
  },
  dialogs: {
    selectFiles: 'dialogs:select-files',
    selectDirectory: 'dialogs:select-directory'
  },
  window: {
    minimize: 'window:minimize',
    toggleMaximize: 'window:toggle-maximize',
    close: 'window:close',
    isMaximized: 'window:is-maximized',
    maximizeChanged: 'window:maximize-changed'
  }
} as const
