export interface BucketInfo {
  name: string
  region?: string
  createdAt?: string
}

export interface CreateBucketInput {
  connectionId: string
  name: string
  region?: string
}

export interface DeleteBucketInput {
  connectionId: string
  name: string
}
