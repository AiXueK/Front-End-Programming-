import React, { useEffect, useState } from 'react';
import { TextField, Grid, Box, IconButton } from '@mui/material';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { Button } from 'react-bootstrap';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import DeleteIcon from '@mui/icons-material/Delete';

import { fileToDataUrl, getBedroomNum } from '../helper/helperFuncs.jsx';
import { BACKEND_URL } from '../helper/getLinks';
import fetchObject from '../helper/fetchObject';
import { DEFAULT_THUMBNAIL_URL } from '../helper/getLinks.jsx';
import CountrySelect, { countries } from '../components/CountrySelect.jsx';
import AmenitiesTags from '../components/AmenitiesTags.jsx';
import PropertyTypeComboBox from '../components/PropertyTypeComboBox';
import MessageAlert from '../components/MessageAlert';

// Page to edit the listing
export default function EditListingPage (props) {
  // set initial values
  const initialMetadata = {
    propertyType: '',
    numberOfBathrooms: 1,
    numberOfBeds: 1,
    amenities: [],
    houseRules: '',
    rooms: {
      singleRoom: { beds: 1, roomNum: 0 },
      twinRoom: { beds: 2, roomNum: 0 },
      familyRoom: { beds: 3, roomNum: 0 },
      quadRoom: { beds: 4, roomNum: 0 },
    },
    imageList: [],
    videoLink: '',
  };

  const initialAddress = {
    street: '',
    city: '',
    state: '',
    postCode: '',
    country: ''
  };
  const { listingId } = useParams();
  const location = useLocation();
  const token = location.state?.token;
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState(initialAddress); // address structure
  const [price, setPrice] = useState('');
  const [metadata, setMetadata] = useState(initialMetadata);
  const [uploadedImg, setUploadedImg] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertContent, setAlertContent] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [errorMessages, setErrorMessages] = useState({});
  const [videoLink, setVideoLink] = useState('');

  // set required error messages
  const validateInputs = () => {
    const errors = {};
    if (!title.trim()) errors.title = 'Title is required.';
    if (!address.street.trim()) errors.street = 'Street is required.';
    if (!address.city.trim()) errors.city = 'City is required.';
    if (!address.state.trim()) errors.state = 'State is required.';
    if (!address.postCode.trim()) errors.postCode = 'PostCode is required.';
    if (!selectedCountry) errors.country = 'Country is required.';
    if (!price.trim()) errors.price = 'Price is required.';
    if (!metadata.propertyType) errors.propertyType = 'Property Type is required.';
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (videoLink !== '' && !regex.test(videoLink)) errors.videoLink = 'Youtube video link is invalid'
    return errors;
  };

  React.useEffect(() => {
    if (metadata.imageList.length !== 0) {
      setUploadedImg(metadata.imageList[0]);
    }
  }, [metadata]);

  // get all listings API
  const getListing = async () => {
    const response = await fetch(`${BACKEND_URL}/listings/${listingId}`, fetchObject(
      'GET', null
    ));
    const data = await response.json();
    if (data.error) {
      props.setErrorModalMsg(data.error);
      props.setErrorModalShow(true)
    } else {
      const { address, metadata, price, title, thumbnail } = data.listing;
      setTitle(title);
      setPrice(price);
      setAddress(address);
      setMetadata(metadata);
      setUploadedImg(thumbnail);
      const fetchedCountry = countries.find(c => c.label === data.listing.address.country);
      setSelectedCountry(fetchedCountry);
      setMetadata(data.listing.metadata);
      setVideoLink(data.listing.metadata.videoLink);
      console.log('lsiitng: ', data.listing)
    }
  };

  const handleVideoChange = (e) => {
    setVideoLink(e.target.value);
    console.log('updated: ', e.target.value);
  }
  // publish new list
  const updateListing = async (body) => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    const response = await fetch(`${BACKEND_URL}/listings/${listingId}`, fetchObject(
      'PUT', body, true, headers
    ));
    const listings = await response.json();
    if (listings.error) {
      setAlertContent('Error updating listing: ' + listings.error);
      setAlertType('danger');
      setShowAlert(true);
    } else {
      navigate('/my-hosted-listings');
      setAlertContent('Listing updated successfully!');
      setAlertType('success');
      setShowAlert(true);
    }
  };

  useEffect(() => {
    getListing();
  }, [listingId]);

  // set data for submit button
  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedAddress = {
      street: address.street.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      postCode: address.postCode.trim(),
      country: address.country,
    };
    const trimmedPrice = price.trim();
    const errors = validateInputs();
    console.log('videoLInk: ', videoLink);
    setMetadata(prevMetadata => ({
      ...prevMetadata,
      videoLink
    }));
    const updatedMetadata = {
      ...metadata,
      videoLink
    };
    console.log('setmetadata: ', metadata);
    if (Object.keys(errors).length === 0) {
      const body = {
        title: trimmedTitle,
        address: trimmedAddress,
        price: trimmedPrice,
        thumbnail: uploadedImg,
        metadata: updatedMetadata,
      };
      if (getBedroomNum(metadata.rooms) === 0) {
        props.setErrorModalMsg('Please choose at least one bedroom!');
        props.setErrorModalShow(true);
        return;
      }
      await updateListing(body);
    } else {
      setErrorMessages(errors);
    }
  };

  // Update images when image is uploaded
  const handleImageChange = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (const file of files) {
        if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
          props.setErrorModalMsg(`Image type is not supported: ${file.type}`);
          props.setErrorModalShow(true);
          return
        }
      }
      try {
        let imageList = await Promise.all(
          [...files].map(file => fileToDataUrl(file))
        );
        setMetadata(prevMetadata => ({
          ...prevMetadata,
          imageList: [...prevMetadata.imageList, ...imageList]
        }));
        if (imageList.length > 0) {
          if (imageList[0] === DEFAULT_THUMBNAIL_URL && imageList.length > 1) {
            imageList = imageList.slice(1);
          }
          setUploadedImg(imageList[0]);
        }
      } catch (error) {
        props.setErrorModalMsg(error);
        props.setErrorModalShow(true)
      }
    }
  };

  // Clear the image lists and thumbnail for clear button
  const handleClearImage = () => {
    setUploadedImg(DEFAULT_THUMBNAIL_URL);
    setMetadata(prevMetadata => ({
      ...prevMetadata,
      imageList: []
    }));
  };

  const handleMetadataChange = (e) => {
    const { id, value } = e.target;
    setMetadata((prevMetadata) => ({
      ...prevMetadata,
      [id]: value
    }));
  };

  const handleAmenitiesChange = (newValue) => {
    setMetadata((prevMetadata) => ({
      ...prevMetadata,
      amenities: newValue
    }));
  };

  const handleCountryChange = (event, newValue) => {
    setAddress({ ...address, country: newValue ? newValue.label : '' });
    setSelectedCountry(newValue);
  };

  const handleBack = () => {
    navigate('/my-hosted-listings');
  }

  // Calculate and update the room numbers when bedroom is changed
  const updateRoomNumber = (roomType, change) => {
    setMetadata(prevMetadata => {
      const currentRoomNum = prevMetadata.rooms[roomType].roomNum;
      const newRoomNum = Math.max(currentRoomNum + change, 0);
      const updatedRooms = {
        ...prevMetadata.rooms,
        [roomType]: {
          ...prevMetadata.rooms[roomType],
          roomNum: newRoomNum
        }
      };
      const totalBeds = Object.values(updatedRooms).reduce(
        (sum, room) => sum + (room.beds * room.roomNum), 0);
      return {
        ...prevMetadata,
        rooms: updatedRooms,
        numberOfBeds: totalBeds
      };
    });
  };

  const handleRemoveImage = (index) => {
    if (metadata.imageList && metadata.imageList.length > 0) {
      setMetadata(prevMetadata => ({
        ...prevMetadata,
        imageList: prevMetadata.imageList.filter((_, i) => i !== index)
      }));
    }
  };

  const roomTypes = [
    { id: 'singleRoom', label: 'Single Room' },
    { id: 'twinRoom', label: 'Twin Room' },
    { id: 'familyRoom', label: 'Family Room' },
    { id: 'quadRoom', label: 'Quad Room' },
  ];

  return (
    <>
    {showAlert && (
      <MessageAlert
        msgType={alertType}
        msgContent={alertContent}
      />
    )}
    {/* Edit listing form */}
    <form onSubmit={handleSubmit}>
    <Box>
    <Grid container spacing={2}>
    <Grid item xs={12} md={8} lg={4}> {/* image container */}
    <Box >
    <IconButton onClick={handleBack} aria-label="back">
      <ChevronLeftIcon />
    </IconButton>
    <Box padding={1}>
      <label htmlFor="thumbnail">Select an Image to Post</label></Box>
      <Box paddingTop={1}>
        <input
        id="thumbnail"
        type="text"
        value={uploadedImg}
        required
        style={{ display: 'none' }}
      />
      </Box>
      <Box padding={1}>
          <div>
          <img src={uploadedImg || DEFAULT_THUMBNAIL_URL} alt="Thumbnail" style={{ width: '85%', height: '85%' }} />
          <input
          accept="image/*"
          id="icon-button-file"
          type="file"
          style={{ display: 'none' }}
          onChange={handleImageChange}
          multiple/>
          <label htmlFor="icon-button-file">
            <IconButton color="primary" aria-label="upload picture" component="span">
            <PhotoCamera />
            </IconButton>
          </label>
          <Box padding={1}>
            {uploadedImg && (
            <Button variant="secondary" onClick={handleClearImage}>Clear Image</Button>
            )}
          </Box>
          </div>
      </Box>
      </Box>
      <Box padding={1} sx={{ maxHeight: 300, overflowY: 'auto' }}>
        {metadata.imageList && metadata.imageList.length > 0 && (
          metadata.imageList.map((imgUrl, index) => (
            <Box key={index} display="flex" alignItems="center" marginBottom={2}>
              <img src={imgUrl} alt={`Thumbnail ${index}`} style={{ width: 100, height: 100 }} />
              <IconButton onClick={() => handleRemoveImage(index)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))
        )}
      </Box>
      <br />
      <TextField
        fullWidth
        id="video-link"
        label="Video link"
        type="text"
        value={videoLink}
        onChange={handleVideoChange}
        error={!!errorMessages.videoLink}
        helperText={errorMessages.videoLink || ''}
      />
    </Grid>
        <Grid item xs={12} lg={8} paddingLeft={2}>
          <Grid item xs={8} md={4} lg={3} paddingTop={3} paddingBottom={2} paddingRight={1}>
             <TextField
            fullWidth
            id="title"
            label="Title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!errorMessages.title}
            helperText={errorMessages.title || ''}
            required
          />
        </Grid>
      {/* Address Section */}
      <Grid container spacing={2} >
      <Grid item xs={8} md={3} lg={2} paddingTop={2} paddingBottom={2} paddingRight={1}>
          <TextField
            fullWidth
            id="street"
            label="Street"
            type="text"
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
            error={!!errorMessages.street}
            helperText={errorMessages.street || ''}
            required
          />
        </Grid>
        <Grid item xs={8} md={3} lg={2} paddingTop={2} paddingBottom={2} paddingRight={1}>
          <TextField
            fullWidth
            id="city"
            label="City"
            type="text"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            error={!!errorMessages.city}
            helperText={errorMessages.city || ''}
            required
          />
        </Grid>
        <Grid item xs={8} md={3} lg={2} paddingTop={2} paddingBottom={2} paddingRight={1}>
          <TextField
            fullWidth
            id="state"
            label="State"
            type="text"
            value={address.state}
            onChange={(e) => setAddress({ ...address, state: e.target.value })}
            error={!!errorMessages.state}
            helperText={errorMessages.state || ''}
            required
          />
        </Grid>
        <Grid item xs={8} md={3} lg={2} paddingTop={2} paddingBottom={2} paddingRight={1}>
          <TextField
            fullWidth
            id="postCode"
            label="PostCode"
            type="text"
            value={address.postCode}
            onChange={(e) => setAddress({ ...address, postCode: e.target.value })}
            error={!!errorMessages.postCode}
            helperText={errorMessages.postCode || ''}
            required
          />
        </Grid>

        <Grid item xs={10} md={4} lg={3} paddingTop={2} paddingBottom={2} paddingRight={1}>
          <CountrySelect
            value={selectedCountry}
            onChange={handleCountryChange}
            error={!!errorMessages.country}
            helperText={errorMessages.country || ''}
            required
          />
        </Grid>
      </Grid>
      {/* Price Input */}
      <Grid item xs={8} md={3} lg={2} paddingTop={2} paddingBottom={2} paddingRight={1}>
          <TextField
            fullWidth
            id="price"
            label="Price"
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            error={!!errorMessages.price}
            helperText={errorMessages.price || ''}
            required
          />
        </Grid>
      {/* Metadata Inputs */}
      <Grid item xs={10} md={4} lg={3} paddingTop={2} paddingBottom={2} paddingRight={1}>
        <PropertyTypeComboBox
          value={metadata.propertyType}
          onChange={handleMetadataChange}
          error={!!errorMessages.propertyType}
          helperText={errorMessages.propertyType || ''}
        />
      </Grid>

      <Grid item xs={8} md={3} lg={2} paddingTop={2} paddingBottom={2} paddingRight={1}>
          <TextField
            fullWidth
            id="numberOfBathrooms"
            label="Number Of Bathrooms"
            type="number"
            value={metadata.numberOfBathrooms}
            onChange={handleMetadataChange}
            required
            InputLabelProps={{
              shrink: true,
            }}
            inputProps = {{
              min: '0'
            }}
          />
        </Grid>

        <Grid item xs={8} md={3} lg={2} paddingTop={2} paddingBottom={2} paddingRight={1}>
          <TextField
            fullWidth
            id="numberOfBeds"
            label="Number Of Beds"
            type="number"
            value={metadata.numberOfBeds}
            onChange={handleMetadataChange}
            required
            InputLabelProps={{
              shrink: true,
            }}
            inputProps={{
              min: '1'
            }}
          />
        </Grid>
        <Grid Grid item xs={11} md={8} lg={7} paddingTop={2} paddingBottom={2} paddingRight={1}>
            <List sx={{
              width: '80%',
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'primary.main',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
          {roomTypes.map((room) => (
            <ListItem
              key={room.id}
              disableGutters
              sx={{ borderBottom: 1, borderColor: 'divider', padding: '10px' }}
            >
              <ListItemText
                primary={room.label}
                secondary={`Beds: ${metadata.rooms[room.id].beds}`}
                secondaryTypographyProps={{
                  style: { color: 'gray', fontSize: '0.875rem' }
                }}
              />
              <Grid container spacing={1} sx={{ width: 'auto', marginLeft: 'auto' }}>
                <Grid item>
                  <Button onClick={() => updateRoomNumber(room.id, -1)}>-</Button>
                </Grid>
                <Grid item>
                  <span>{metadata.rooms[room.id].roomNum}</span>
                </Grid>
                <Grid item>
                  <Button onClick={() => updateRoomNumber(room.id, 1)}>+</Button>
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
            </Grid>
        <Grid item xs={11} md={8} lg={7} paddingTop={2} paddingBottom={2} paddingRight={1}>
          <AmenitiesTags
        selectedAmenities={metadata.amenities}
        onChange={handleAmenitiesChange}
      />
      </Grid>
    <Grid item xs={11} md={8} lg={7} paddingTop={2} paddingBottom={2} paddingRight={1}>
          <TextField
            fullWidth
            id="houseRules"
            label="House Rules"
            type="text"
            value={metadata.houseRules}
            onChange={handleMetadataChange}
          />
        </Grid>
        <Button paddingTop={2} paddingBottom={2} onClick={handleSubmit}>Update Listing</Button>
        </Grid>
      </Grid>
    </Box>
  </form>
  </>
  )
}
