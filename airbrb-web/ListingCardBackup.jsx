import * as React from 'react';
import Card from '@mui/material/Card';
import { Box, CardMedia, IconButton, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { red, blue, green } from '@mui/material/colors';
import Rating from '@mui/material/Rating';
import MapsHomeWorkOutlinedIcon from '@mui/icons-material/MapsHomeWorkOutlined';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
// import BedOutlinedIcon from '@mui/icons-material/BedOutlined';
// import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';

import ConfirmModal from './ConfirmModal';
import { BACKEND_URL } from '../helper/getLinks';
import fetchObject from '../helper/fetchObject';
import AvailabilityModal from './AvailabilityModal';

export default function ListingCard (props) {
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = React.useState(false);
  const [listingInfo, setListingInfo] = React.useState({});
  console.log(`props: ${props.listingId}`);

  // get the listing info based on the listing id
  const getListingInfo = async (listingId) => {
    console.log('getListingInfo');
    const response = await fetch(`${BACKEND_URL}/listings/${listingId}`, fetchObject(
      'GET', null
    ));
    const data = await response.json();
    if (data.error) {
      props.setErrorModalMsg(data.error);
      props.setErrorModalShow(true);
    } else {
      setListingInfo(data.listing);
      console.log(data.listing);
    }
  }

  React.useEffect(() => {
    console.log('here')
    getListingInfo(props.listingId);
    console.log(listingInfo);
  }, []);

  React.useEffect(() => {
    getListingInfo(props.listingid);
  }, [listingInfo])
  // console.log(props);

  const isMounted = React.useRef(false);

  React.useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; }
  }, [])

  // handle delete listing
  const handleDeleteListing = () => {
    setShowConfirmModal(true);
  }

  const getUserRating = () => {
  // Check if reviews is defined and is an array[]
    const reviews = listingInfo.reviews;
    // if (!Array.isArray(reviews)) {
    //   return [0, 0]; // Return default values if reviews is not an array
    // }

    let userRating = 0;
    const reviewLength = reviews.length;
    for (const review of reviews) {
      userRating += parseFloat(review.rating);
    }
    userRating = reviewLength > 0 ? userRating / reviewLength : 0;
    return [userRating, reviewLength];
  }

  const ifOwner = listingInfo.owner === localStorage.getItem('userEmail');
  const [userRating, reviewLength] = getUserRating();
  const boxShadow = listingInfo.published && ifOwner
    ? '0.5vw 0.5vw 0.5vw rgba(0, 128, 0, 0.5)'
    : '0.1vw 0.1vw 0.1vw grey';
  const publishedIconColor = listingInfo.published && ifOwner
    ? green[700]
    : '';
  // delete the listing API
  const deleteListing = async () => {
    const listingId = props.listingId;
    console.log(props);
    console.log(`delete: ${listingId}`);
    const response = await fetch(`${BACKEND_URL}/listings/${listingId}`, fetchObject(
      'DELETE', {}, true
    ));
    const data = await response.json();
    if (data.error) {
      props.setErrorModalMsg(data.error);
      props.setErrorModalShow(true);
    } else {
      let newHostedListings = props.hostedListings;
      // console.log(props.hostedListings);
      newHostedListings = newHostedListings.filter((listingInfo) => String(listingInfo.listingId) !== String(listingId));
      const newAllListings = props.allListings.filter((listingInfo) => String(listingInfo.listingId) !== String(listingId));
      if (isMounted.current) {
        props.setHostedListings(newHostedListings);
        props.setAllListings(newAllListings);
        // console.log(newHostedListings);
        setShowConfirmModal(false);
      }
    }
  }

  return (
    <>
      <ConfirmModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        msg='Are you sure you want to delete this listing?'
        func={deleteListing}
      />
      <Card sx={{
        display: 'flex',
        flexDirection: 'column',
        justifySelf: 'flex-start',
        width: props.cardWidth,
        minWidth: '200px',
        margin: '0.5vw',
        position: 'relative',
        boxShadow: { boxShadow },
      }}>
        <IconButton
          sx={{
            position: 'absolute',
            bottom: '0.5vw',
            right: '0.5vw',
          }}
          aria-label='If published'
          onClick={() => setShowAvailabilityModal(true)}
        >
          <PublishedWithChangesIcon
            fontSize='medium'
            sx={{ color: publishedIconColor }}
          />
        </IconButton>
        <AvailabilityModal
          show={showAvailabilityModal}
          onHide={() => setShowAvailabilityModal(false)}
          {...props}
          listingInfo={listingInfo}
          setListingInfo={setListingInfo}
          // setErrorModalShow={props.setErrorModalShow}
          // errorModalShow={props.errorModalShow}
        />
        <Box sx={{
          position: 'absolute',
          right: '0',
          m: '0.5vw',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Edit Btns for owners, or status for users */}
          {listingInfo.owner
            ? (
                <>
                  <IconButton
                    aria-label="Edit Listing"
                  >
                    <EditOutlinedIcon
                      sx={{ color: blue[900] }}
                      fontSize='medium'
                    />
                  </IconButton >
                  <IconButton
                    aria-label="Delete Listing"
                    onClick={handleDeleteListing}
                  >
                    <DeleteForeverIcon
                      sx={{ color: red[500] }}
                      fontSize='medium'
                    />
                  </IconButton >
                </>
              )
            : (<></>)}
        </Box>
         <CardMedia
          component="img"
          image={listingInfo.thumbnail}
          alt="Thumbnail"
          sx={{
            height: '100%',
            aspectRatio: 1,
            objectFit: 'cover'
          }}
        />
        <Box sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          paddingBottom: '1vw',
        }}>
          <Box sx={{
            display: 'flex',
            alignSelf: 'center',
          }}>
            <Typography variant='h6' fontWeight='bold'>{ listingInfo.title }</Typography>
          </Box>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}>
            <Box sx={{
              display: 'flex',
              justifySelf: 'flex-start',
              flexDirection: 'column',
            }}>
              {listingInfo.metadata
                ? (<>
                  <Typography variant='subtitle2'>
                    <MapsHomeWorkOutlinedIcon fontSize='small'/>
                    {listingInfo.metadata.propertyType}
                  </Typography>
                  <Typography variant='subtitle2' color='grey'>
                    { listingInfo.metadata.numberOfBeds } bed ·
                    { listingInfo.metadata.numberOfBathrooms } bathroom
                  </Typography>
                </>)
                : <div>Loading...</div> // Or any other placeholder
              }
              <Typography variant='subtitle2' fontWeight='bold' sx={{
                display: 'flex',
                alignSelf: 'flex-start',
                textDecoration: 'underline',
              }}>
                ${listingInfo.price}&nbsp;/ night
              </Typography>
              {/* <Typography variant='subtitle2' color='grey'sx={{ display: 'inline', textDecoration: 'none' }}>
                (per night)
              </Typography> */}
            </Box>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
            }}>
              {
                reviewLength === 0
                  ? (<Typography variant='subtitle2'> No Reviews </Typography>)
                  : (<>
                      <Rating name="user-rating" defaultValue={userRating} precision={0.1} readOnly />
                    <Typography variant='subtitle2'>{ reviewLength } reviews</Typography>
                    </>)
              }
            </Box>
          </Box>
        </Box>
      </Card>
    </>
  );
}
