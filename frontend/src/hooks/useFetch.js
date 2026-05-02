import { useEffect, useState, useCallback } from "react";

export const useFetch = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    const abortController = new AbortController();
    fetchData();
    return () => abortController.abort();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export default useFetch;

