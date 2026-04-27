import { dialog } from 'electron'

export class DialogService {
  async selectFiles(): Promise<string[]> {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections']
    })

    return result.canceled ? [] : result.filePaths
  }

  async selectDirectory(): Promise<string | undefined> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    })

    return result.canceled ? undefined : result.filePaths[0]
  }
}
