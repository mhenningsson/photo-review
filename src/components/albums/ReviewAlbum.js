import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import firebase from 'firebase/app'
import { db } from '../../firebase'
import useGetAlbum from '../../hooks/useGetAlbum'
import useGetPhotosInAlbum from '../../hooks/useGetPhotosInAlbum'
import { Alert, Button, Container, Row } from 'react-bootstrap'
import {SRLWrapper} from "simple-react-lightbox"
import PhotoGrid from './PhotoGrid'
import LoadingSpinner from '../LoadingSpinner'

const ReviewAlbum = () => {
    const [likedPhotos, setLikedPhotos] = useState([]);
    const [reviewedPhotos, setReviewedPhotos] = useState([]);
    const [disabledBtn, setDisabledBtn] = useState(true);
    const { albumId } = useParams();
    const navigate = useNavigate();
    const {album} = useGetAlbum(albumId);
    const {photos, loading} = useGetPhotosInAlbum(albumId)
    const [error, setError] = useState(false);

    useEffect(() => {
        // Get photos and add to a review array
        async function getPhotos() {
            const photoList = await Promise.all(
                photos.map(photo => {
                    return {
                        id: photo.id, 
                        like: undefined
                    }
                })
            )
            setReviewedPhotos(photoList);
        }
        getPhotos();
    }, [photos]);

    useEffect(() => {
        // Update array with liked photos
        let likedArray = reviewedPhotos.filter(photo => {
            return photo.like === true
        });
        setLikedPhotos(likedArray);

        // Check if all photos have been reviewed, if true set disabled button to false
        let result = reviewedPhotos.every(photo => photo.like !== undefined);
        if (result === false) {
            setDisabledBtn(true);
            return;
        } else if (result === true) {
            setDisabledBtn(false);
        }
    }, [reviewedPhotos])

    const updatePhotoReaction = (photo, reaction) => {
        // Map over reviewed photos and update like reaction
        let updatedArray = reviewedPhotos.map(item => {
            if (item.id === photo.id) {
                return {
                    id: item.id,
                    like: reaction
                }
            } else {
                return item;
            }
        })
        setReviewedPhotos(updatedArray);
        toggleThumbs(photo.id, reaction);
    }

    const handleSendReview = async () => {
        console.log('sent review', reviewedPhotos);
        const title = `${album.title}-${Date.now()}`;

        setError(false);

        try {
            const docRef = await db.collection('albums').add({
                title,
                owner: album.owner
            });

            await likedPhotos.forEach(photo => {
                db.collection('images').doc(photo.id).update({
                    album: firebase.firestore.FieldValue.arrayUnion(db.collection('albums').doc(docRef.id))
                })
            })

            navigate(`/review/thanks`);
        } catch (err) {
            setError(err.message);
        }
    }

    const toggleThumbs = (id, reaction) => {
        let card = document.getElementById(id);
        if (reaction === true) {
            card.getElementsByClassName('thumbs-up')[0].classList.add('thumb-active');
            card.getElementsByClassName('thumbs-down')[0].classList.remove('thumb-active');
        } else if (reaction === false) {
            card.getElementsByClassName('thumbs-down')[0].classList.add('thumb-active');
            card.getElementsByClassName('thumbs-up')[0].classList.remove('thumb-active');
        }
    }

    return (
        <Container fluid className="px-4">
            <h2 className="text-center">Review for: {album && album.title}</h2>
            <p className="text-center mb-2">{album && album.description}</p>

            <SRLWrapper>
                <Row className="justify-content-md-center">
                    {loading
                        ? (
                            <LoadingSpinner />
                        )
                        : (
                            photos.map(photo => (
                                <PhotoGrid 
                                    photo={photo} 
                                    albumId={albumId} 
                                    updatePhotoReaction={updatePhotoReaction} 
                                    key={photo.id} 
                                    />
                            ))
                        )  
                    }
                </Row>
            </SRLWrapper>

            {
                reviewedPhotos && likedPhotos.length > 0 && (
                    <div className="text-center mt-3">
                        <p>Liked photos: {likedPhotos.length} / {photos.length}</p>
                        <div className="d-flex justify-content-center">
                            <Button 
                                disabled={disabledBtn} 
                                variant="dark" 
                                className="mr-3" 
                                onClick={handleSendReview}>
                                    Send Review
                            </Button>
                        </div>
                        {
                            error && (
                                <Alert variant="danger">{error}</Alert>
                            )
                        }
                    </div>
                )
            }
        </Container>
    )
}

export default ReviewAlbum
