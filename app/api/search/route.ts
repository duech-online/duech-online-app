import { NextRequest } from 'next/server';
import { handleSearchRequest } from './shared';

export async function GET(request: NextRequest) {
  return handleSearchRequest(request);
}
