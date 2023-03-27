interface APIError {
  data: {
    error: {
      message: string
    }
  }
}
const isAPIError = (error: APIError | unknown): error is APIError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'error' in error.data &&
    typeof error.data.error === 'object' &&
    error.data.error !== null &&
    'message' in error.data.error
  )
}
export const errorToString = (error: unknown): string => {
  if (typeof error === 'string') {
    return error
  } else if (error instanceof Error) {
    return error.message
  } else if (isAPIError(error)) {
    return error.data.error.message
  } else {
    return 'An unknown error occurred'
  }
}
