import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Box, IconButton } from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import Grid from '@mui/material/Unstable_Grid2';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import DeleteIcon from '@mui/icons-material/Delete';

import { DEFAULT_THUMBNAIL_URL } from '../helper/getLinks.jsx';
import CountrySelect, { countries } from './CountrySelect.jsx';
import AmenitiesTags from './AmenitiesTags.jsx';
import PropertyTypeComboBox from './PropertyTypeComboBox';
import { fileToDataUrl, getBedroomNum } from '../helper/helperFuncs.jsx';
import JsonUploadButton from './JsonUploadBtn.jsx';

export default function CreateListingModal (props) {
  const initialMetadata = {
    propertyType: '',
    numberOfBathrooms: 1,
    numberOfBeds: 0,
    amenities: [],
    houseRules: '',
    rooms: {
      singleRoom: { beds: 1, roomNum: 0 },
      twinRoom: { beds: 2, roomNum: 0 },
      familyRoom: { beds: 3, roomNum: 0 },
      quadRoom: { beds: 4, roomNum: 0 },
    },
    imageList: [],
    videoLink: ''
  };

  const initialAddress = {
    street: '',
    city: '',
    state: '',
    postCode: '',
    country: ''
  };

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState(initialAddress); // address structure
  const [price, setPrice] = useState('');
  const [metadata, setMetadata] = useState(initialMetadata);
  const [uploadedImg, setUploadedImg] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [errorMessages, setErrorMessages] = useState({});
  const [uploadedData, setUploadedData] = useState({});
  const [videoLink, setVideoLink] = useState('');

  // Modal close
  const handleClose = () => {
    props.onHide();
  };

  React.useEffect(() => {
    if (metadata.imageList.length !== 0) {
      setUploadedImg(metadata.imageList[0]);
    }
  }, [metadata]);

  React.useEffect(() => {
    if (uploadedData && Object.entries(uploadedData).length !== 0) {
      try {
        setTitle(uploadedData.title);
        let countryObject = countries.filter(country => country.label === uploadedData.address.country);
        if (countryObject) {
          countryObject = countryObject[0];
          setSelectedCountry(countryObject);
        } else {
          setSelectedCountry('');
        }
        setAddress({
          street: uploadedData.address.street,
          city: uploadedData.address.city,
          state: uploadedData.address.state,
          postCode: uploadedData.address.postCode,
          country: selectedCountry ? selectedCountry.label : ''
        });
        setPrice(uploadedData.price);
        setUploadedImg(uploadedData.thumbnail);
        setMetadata(uploadedData.metadata);
        setVideoLink(uploadedData.metadata.videoLink);
      } catch {
        props.setErrorModalMsg('Invalid JSON format');
        props.setErrorModalShow(true)
      }
    }
  }, [uploadedData]);

  const validateInputs = () => {
    const errors = {};
    if (!title.trim()) errors.title = 'Title is required.';
    if (!address.street.trim()) errors.street = 'Street is required.';
    if (!address.city.trim()) errors.city = 'City is required.';
    if (!address.state.trim()) errors.state = 'State is required.';
    if (!address.postCode.trim()) errors.postCode = 'PostCode is required.';
    if (isNaN(Number(String(address.postCode).trim()))) errors.postCode = 'PostCode must be a number.';
    if (!selectedCountry) errors.country = 'Country is required.';
    if (!String(price).trim()) errors.price = 'Price is required.';
    if (isNaN(Number(String(price).trim()))) errors.price = 'Price must be a number.';
    if (!metadata.propertyType) errors.propertyType = 'Property Type is required.';
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (videoLink !== '' && !regex.test(videoLink)) errors.videoLink = 'Youtube video link is invalid'
    return errors;
  };

  // submit create list
  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedAddress = {
      street: address.street.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      postCode: address.postCode.trim(),
      country: selectedCountry ? selectedCountry.label : '',
    };
    const trimmedPrice = String(price).trim();
    const errors = validateInputs();
    setMetadata(prevMetadata => ({
      ...prevMetadata,
      videoLink
    }));
    const updatedMetadata = {
      ...metadata,
      videoLink
    };
    if (Object.keys(errors).length === 0) {
      const body = {
        title: trimmedTitle,
        address: trimmedAddress,
        price: trimmedPrice,
        thumbnail: uploadedImg || DEFAULT_THUMBNAIL_URL,
        metadata: updatedMetadata
      }
      if (getBedroomNum(metadata.rooms) === 0) {
        props.setErrorModalMsg('Please choose at least one bedroom!');
        props.setErrorModalShow(true);
        return;
      }
      props.createListing(body);
      handleClose();
    } else {
      setErrorMessages(errors);
    }
  };

  // Update images when image is uploaded
  const handleImageChange = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (const file of files) {
        if (!file.type.match('image.*')) {
          props.setErrorModalMsg('Please select an image file.');
          props.setErrorModalShow(true);
          return;
        }
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

  const handleRemoveImage = (index) => {
    if (metadata.imageList && metadata.imageList.length > 0) {
      setMetadata(prevMetadata => ({
        ...prevMetadata,
        imageList: prevMetadata.imageList.filter((_, i) => i !== index)
      }));
    }
  };

  // set the uploaded json data
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.json')) {
        props.setErrorModalMsg('Please upload JSON file');
        props.setErrorModalShow(true);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        try {
          const data = JSON.parse(text);
          setUploadedData(data);
          console.log('uploaded data: ', uploadedData);
        } catch (error) {
          props.setErrorModalMsg(error);
          props.setErrorModalShow(true)
        }
      };
      reader.readAsText(file);
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

  const roomTypes = [
    { id: 'singleRoom', label: 'Single Room' },
    { id: 'twinRoom', label: 'Twin Room' },
    { id: 'familyRoom', label: 'Family Room' },
    { id: 'quadRoom', label: 'Quad Room' },
  ];

  return (
    <Modal
      show={props.show}
      onHide={handleClose}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Listing</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <JsonUploadButton handleFileChange={handleFileChange} />
        <Grid container spacing={2}>
        <Grid xs={12} md={8} lg={4}> {/* image container */}
          <label htmlFor="thumbnail">Select an Image to Post</label >
          <input
            id="thumbnail"
            type="text"
            value={uploadedImg}
            required
            style={{ display: 'none' }}
          />
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
              {uploadedImg && (
                <Button variant="secondary" onClick={handleClearImage}>Clear Image</Button>
              )}
            </div>
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
              onChange={(e) => setVideoLink(e.target.value)}
              error={!!errorMessages.videoLink}
              helperText={errorMessages.videoLink || ''}
            />
          </Grid>
            <Grid item xs={12} lg={8} container spacing={2}>
              <Grid item xs={9} md={7} lg={6}>
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
          <Grid container spacing={2}>
          <Grid item xs={9} md={7} lg={6}>
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
            <Grid item xs={9} md={7} lg={6}>
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
            <Grid item xs={9} md={7} lg={6}>
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
            <Grid item xs={9} md={7} lg={6}>
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

            <Grid item xs={9} md={7} lg={6}>
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
          <Grid item xs={8} md={7} lg={6}>
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
          <Grid item xs={11} md={7} lg={6}>
            <PropertyTypeComboBox
              value={metadata.propertyType}
              onChange={handleMetadataChange}
              error={!!errorMessages.propertyType}
              helperText={errorMessages.propertyType || ''}
            />
          </Grid>

          <Grid item xs={10} md={9} lg={8}>
              <TextField
                fullWidth
                id="numberOfBathrooms"
                label="Number Of Bathrooms"
                type="number"
                value={metadata.numberOfBathrooms}
                onChange={handleMetadataChange}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps = {{
                  min: '0'
                }}
              />
            </Grid>

            <Grid item xs={10} md={7} lg={6}>
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
            <Grid item xs={12} md={9} lg={8}>
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
              id={room.id}
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
                  <Button id={`decrease-${room.id}`} onClick={() => updateRoomNumber(room.id, -1)}>-</Button>
                </Grid>
                <Grid item>
                  <span>{metadata.rooms[room.id].roomNum}</span>
                </Grid>
                <Grid item>
                  <Button id={`increase-${room.id}`} onClick={() => updateRoomNumber(room.id, 1)}>+</Button>
                </Grid>
              </Grid>
            </ListItem>
          ))}
        </List>
            </Grid>
            <Grid item xs={12} md={9} lg={8}>
              <AmenitiesTags
            selectedAmenities={metadata.amenities}
            onChange={handleAmenitiesChange}
          />
          </Grid>
        <Grid item xs={12} md={9} lg={8}>
              <TextField
                fullWidth
                id="houseRules"
                label="House Rules"
                type="text"
                value={metadata.houseRules}
                onChange={handleMetadataChange}
              />
            </Grid>
            </Grid>
          </Grid>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSubmit}>Create Listing</Button>
          <Button onClick={handleClose}>Close</Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
