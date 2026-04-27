import { safeStorage } from 'electron'

export class CredentialService {
  encrypt(value: string): string {
    if (!value) return ''

    if (!safeStorage.isEncryptionAvailable()) {
      return Buffer.from(value, 'utf8').toString('base64')
    }

    return safeStorage.encryptString(value).toString('base64')
  }

  decrypt(value: string): string {
    if (!value) return ''

    const buffer = Buffer.from(value, 'base64')

    if (!safeStorage.isEncryptionAvailable()) {
      return buffer.toString('utf8')
    }

    return safeStorage.decryptString(buffer)
  }
}
