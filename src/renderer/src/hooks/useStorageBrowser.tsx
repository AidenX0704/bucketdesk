import { Modal, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import type { BucketInfo } from '../../../shared/types/bucket'
import type { ConnectionSummary } from '../../../shared/types/connection'
import type { ListObjectsResult, StorageObject } from '../../../shared/types/object'

export function useStorageBrowser(activeConnection: ConnectionSummary | undefined) {
  const [buckets, setBuckets] = useState<BucketInfo[]>([])
  const [objectsResult, setObjectsResult] = useState<ListObjectsResult>()
  const [activeBucket, setActiveBucket] = useState<string>()
  const [prefix, setPrefix] = useState('')
  const [loadingBuckets, setLoadingBuckets] = useState(false)
  const [loadingObjects, setLoadingObjects] = useState(false)

  const loadBuckets = useCallback(async () => {
    if (!activeConnection) return

    setLoadingBuckets(true)
    const result = await window.api.storage.listBuckets(activeConnection.id)
    setLoadingBuckets(false)

    if (result.ok) {
      setBuckets(result.data)
      return
    }

    message.error(result.error.message)
  }, [activeConnection])

  const loadObjects = useCallback(async () => {
    if (!activeConnection || !activeBucket) return

    setLoadingObjects(true)
    const result = await window.api.storage.listObjects({
      connectionId: activeConnection.id,
      bucket: activeBucket,
      prefix
    })
    setLoadingObjects(false)

    if (result.ok) {
      setObjectsResult(result.data)
      return
    }

    message.error(result.error.message)
  }, [activeBucket, activeConnection, prefix])

  useEffect(() => {
    setActiveBucket(undefined)
    setObjectsResult(undefined)
    void loadBuckets()
  }, [activeConnection, loadBuckets])

  useEffect(() => {
    void loadObjects()
  }, [loadObjects])

  const openBucket = useCallback((bucket: BucketInfo) => {
    setPrefix('')
    setActiveBucket(bucket.name)
  }, [])

  const backToBuckets = useCallback(() => {
    setActiveBucket(undefined)
  }, [])

  const createBucket = useCallback(async (): Promise<void> => {
    if (!activeConnection) return
    let bucketName = ''
    Modal.confirm({
      centered: true,
      title: '创建 Bucket',
      content: <input placeholder="bucket-name" onChange={(event) => (bucketName = (event.target as HTMLInputElement).value)} />,
      okText: '创建',
      cancelText: '取消',
      onOk: async () => {
        const result = await window.api.storage.createBucket({ connectionId: activeConnection.id, name: bucketName })
        if (result.ok) await loadBuckets()
        else message.error(result.error.message)
      }
    })
  }, [activeConnection, loadBuckets])

  const deleteBucket = useCallback(
    (bucket: BucketInfo): void => {
      if (!activeConnection) return
      Modal.confirm({
        centered: true,
        title: `删除 Bucket ${bucket.name}？`,
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          const result = await window.api.storage.deleteBucket({ connectionId: activeConnection.id, name: bucket.name })
          if (result.ok) await loadBuckets()
          else message.error(result.error.message)
        }
      })
    },
    [activeConnection, loadBuckets]
  )

  const uploadObject = useCallback(async (): Promise<{ tasks: Array<{ connectionId: string; bucket: string; objectKey: string; localPath: string }> } | undefined> => {
    if (!activeConnection || !activeBucket) return
    const result = await window.api.dialogs.selectFiles()
    if (!result.ok || result.data.length === 0) return

    const tasks: Array<{ connectionId: string; bucket: string; objectKey: string; localPath: string }> = []
    for (const localPath of result.data) {
      const fileName = localPath.split(/[\\/]/).pop() ?? 'file'
      tasks.push({
        connectionId: activeConnection.id,
        bucket: activeBucket,
        objectKey: `${prefix}${fileName}`,
        localPath
      })
    }
    return { tasks }
  }, [activeConnection, activeBucket, prefix])

  const downloadObject = useCallback(
    async (object: StorageObject): Promise<{ connectionId: string; bucket: string; objectKey: string; localPath: string } | undefined> => {
      if (!activeConnection || !activeBucket) return undefined
      const directory = await window.api.dialogs.selectDirectory()
      if (!directory.ok || !directory.data) return undefined

      const fileName = object.key.split('/').pop() ?? object.key
      return {
        connectionId: activeConnection.id,
        bucket: activeBucket,
        objectKey: object.key,
        localPath: `${directory.data}\\${fileName}`
      }
    },
    [activeConnection, activeBucket]
  )

  const deleteObject = useCallback(
    async (object: StorageObject): Promise<void> => {
      if (!activeConnection || !activeBucket) return
      const result = await window.api.storage.deleteObjects({
        connectionId: activeConnection.id,
        bucket: activeBucket,
        keys: [object.key]
      })
      if (result.ok) await loadObjects()
      else message.error(result.error.message)
    },
    [activeConnection, activeBucket, loadObjects]
  )

  const createPresignedUrl = useCallback(
    async (object: StorageObject, expiresInSeconds = 3600): Promise<void> => {
      if (!activeConnection || !activeBucket) return
      const result = await window.api.storage.createPresignedUrl({
        connectionId: activeConnection.id,
        bucket: activeBucket,
        key: object.key,
        expiresInSeconds
      })
      if (result.ok) void navigator.clipboard.writeText(result.data).then(() => message.success('链接已复制'))
      else message.error(result.error.message)
    },
    [activeConnection, activeBucket]
  )

  const createFolder = useCallback(
    async (name: string): Promise<void> => {
      if (!activeConnection || !activeBucket) return
      const folderKey = `${prefix}${name}/`
      const result = await window.api.storage.createFolder({
        connectionId: activeConnection.id,
        bucket: activeBucket,
        key: folderKey
      })
      if (result.ok) await loadObjects()
      else message.error(result.error.message)
    },
    [activeConnection, activeBucket, prefix, loadObjects]
  )

  const renameObject = useCallback(
    async (object: StorageObject, newName: string): Promise<void> => {
      if (!activeConnection || !activeBucket) return
      const oldKey = object.key
      const lastSlash = oldKey.lastIndexOf('/')
      const parentPath = lastSlash >= 0 ? oldKey.slice(0, lastSlash + 1) : ''
      const newKey = object.isPrefix ? `${parentPath}${newName}/` : `${parentPath}${newName}`

      const copyResult = await window.api.storage.copyObject({
        connectionId: activeConnection.id,
        sourceBucket: activeBucket,
        sourceKey: oldKey,
        targetBucket: activeBucket,
        targetKey: newKey
      })
      if (!copyResult.ok) {
        message.error(copyResult.error.message)
        return
      }

      const deleteResult = await window.api.storage.deleteObjects({
        connectionId: activeConnection.id,
        bucket: activeBucket,
        keys: [oldKey]
      })
      if (!deleteResult.ok) {
        message.error(deleteResult.error.message)
        return
      }

      message.success('重命名成功')
      await loadObjects()
    },
    [activeConnection, activeBucket, loadObjects]
  )

  const copyObjectTo = useCallback(
    async (object: StorageObject, targetBucket: string, targetPrefix: string): Promise<void> => {
      if (!activeConnection || !activeBucket) return
      const fileName = object.key.split('/').pop() ?? object.key
      const result = await window.api.storage.copyObject({
        connectionId: activeConnection.id,
        sourceBucket: activeBucket,
        sourceKey: object.key,
        targetBucket,
        targetKey: `${targetPrefix}${fileName}`
      })
      if (result.ok) {
        message.success('复制成功')
        if (targetBucket === activeBucket) await loadObjects()
      } else {
        message.error(result.error.message)
      }
    },
    [activeConnection, activeBucket, loadObjects]
  )

  const moveObjectTo = useCallback(
    async (object: StorageObject, targetBucket: string, targetPrefix: string): Promise<void> => {
      if (!activeConnection || !activeBucket) return
      const fileName = object.key.split('/').pop() ?? object.key
      const result = await window.api.storage.moveObject({
        connectionId: activeConnection.id,
        sourceBucket: activeBucket,
        sourceKey: object.key,
        targetBucket,
        targetKey: `${targetPrefix}${fileName}`
      })
      if (result.ok) {
        message.success('移动成功')
        await loadObjects()
      } else {
        message.error(result.error.message)
      }
    },
    [activeConnection, activeBucket, loadObjects]
  )

  return {
    buckets,
    objectsResult,
    activeBucket,
    prefix,
    setPrefix,
    loadingBuckets,
    loadingObjects,
    loadBuckets,
    loadObjects,
    openBucket,
    backToBuckets,
    createBucket,
    deleteBucket,
    uploadObject,
    downloadObject,
    deleteObject,
    createPresignedUrl,
    createFolder,
    renameObject,
    copyObjectTo,
    moveObjectTo
  }
}
