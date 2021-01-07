import React, { useEffect, useState } from 'react'
import { db } from '../firebase'

const useGetAlbums = () => {
    const [albums, setAlbums] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = db.collection('albums').orderBy('title').onSnapshot(snapshot => {
            setLoading(true);
            const snapshotAlbums = [];
            snapshot.forEach(doc => {
                snapshotAlbums.push({
                    id: doc.id,
                    ...doc.data()
                })
            })
            setAlbums(snapshotAlbums);
            setLoading(false);
        })
        return unsubscribe;
    }, [])

    return {albums, loading}
}

export default useGetAlbums
