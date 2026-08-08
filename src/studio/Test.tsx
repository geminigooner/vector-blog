import React, { useEffect, useState } from 'react';
import { getPublishedArtifacts } from '../lib/data';
export function Test() {
  const [data, setData] = useState<any[]>([]);
  const [err, setErr] = useState<string>('');
  useEffect(() => {
    getPublishedArtifacts().then(setData).catch(e => setErr(e.message));
  }, []);
  return <div>Test: {data.length} {err}</div>;
}
