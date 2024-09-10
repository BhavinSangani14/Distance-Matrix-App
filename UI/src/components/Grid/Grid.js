import React from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CsvLogo from "../../assets/csv.png";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import dayjs from "dayjs";
import axios from "axios";
import { useRef } from "react";
import utc from "dayjs/plugin/utc"; // Import the utc plugin
import moment from "moment-timezone"; // Import moment-timezone
dayjs.extend(utc); // Extend dayjs with utc plugin

const getTimezoneOptions = () => {
  const timezones = moment.tz.names();
  return timezones.map(timezone => ({
    label: `${timezone} (${moment.tz(timezone).format('Z')})`,
    value: timezone
  }));
};

const MyForm = () => {
  const [startDateTime, setStartDateTime] = React.useState(dayjs().utc());
  const [endDateTime, setEndDateTime] = React.useState(dayjs().utc());
  const [frequency, setFrequency] = React.useState("");
  const [mode, setMode] = React.useState("");
  const inputFileRef = useRef(null);
  const [timezone, setTimezone] = React.useState('UTC');

  const handleTimeZoneChange = (event) => {
    setTimezone(event.target.value);
  };

  const handleStartDateTimeChange = (newValue) => {
    setStartDateTime(newValue);
  };

  const handleEndDateTimeChange = (newValue) => {
    setEndDateTime(newValue);
  };

  const handleFrequencyChange = (event) => {
    setFrequency(event.target.value);
  };

  const handleModeChange = (event) => {
    setMode(event.target.value);
  };

  const handleSubmit = async () => {
    if (!inputFileRef.current.files[0]) {
      alert("Please select a file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileContent = event.target.result;

      const data = {
        file: fileContent,
        start_date_time: startDateTime,
        end_date_time: endDateTime,
        frequency: frequency,
        transport_mode: mode,
        timezone: timezone
      };
      try {
        const response = await axios.post(
          "https://vv7s6jncp0.execute-api.us-east-2.amazonaws.com/prod/distance_matrix",
          data,
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error sending request:", error);
      }
    };
    reader.readAsText(inputFileRef.current.files[0]);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Grid container spacing={3} paddingInline={3} sx={{ marginTop: "1px" }}>
        {/* Left Side Cards */}
        <Grid
          item
          xs={12}
          md={3}
          lg={3}
          sx={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <Card
            sx={{ boxShadow: "none", marginBottom: 2, paddingBlock: "2px" }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                <img src={CsvLogo} height="50px" alt="csv logo" />

                <Box sx={{ textAlign: "center" }}>{""}</Box>

                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                >
                  Upload file
                  <input type="file" hidden accept=".csv" ref={inputFileRef} />
                </Button>
              </Box>
            </CardContent>
          </Card>

          <div style={{ marginBottom: 10 }}></div>

          {/* Left Side Bottom Card */}
          <Card sx={{ flexGrow: 1, boxShadow: "none", paddingBlock: "10px" }}>
            <CardContent>
              <Grid container spacing={4} direction="column">

                {/* Timezone Selector */}
                <Grid item xs={12}>
                  <FormControl required sx={{ minWidth: 230 }}>
                    <InputLabel id="timezone-label">TimeZone</InputLabel>
                    <Select
                    sx={{ textAlign: "left" }}
                    labelId="timezone-label"
                    value={timezone}
                    label="TimeZone"
                    onChange={handleTimeZoneChange}
                  >
                    {getTimezoneOptions().map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>

                  </FormControl>
                </Grid>
  
                <Grid item xs={12}>
                  <DateTimePicker
                    label="Start Date & Time"
                    value={startDateTime}
                    onChange={handleStartDateTimeChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <DateTimePicker
                    label="End Date & Time"
                    value={endDateTime}
                    onChange={handleEndDateTimeChange}
                  />
                </Grid>

                {/* Frequency Selector */}

                <Grid item xs={12}>
                  <FormControl required sx={{ minWidth: 230 }}>
                    <InputLabel id="frequency-label">Frequency</InputLabel>
                    <Select
                      sx={{ textAlign: "left" }}
                      labelId="frequency-label"
                      value={frequency}
                      label="Frequency"
                      onChange={handleFrequencyChange}
                    >
                      <MenuItem value={15}>Every 15 minutes</MenuItem>
                      <MenuItem value={30}>Every 30 minutes</MenuItem>
                      <MenuItem value={60}>Every 60 minutes</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl required sx={{ minWidth: 230 }}>
                    <InputLabel id="mode-label">Transport mode</InputLabel>
                    <Select
                      sx={{ textAlign: "left" }}
                      labelId="mode-label"
                      value={mode}
                      label="Transport mode"
                      onChange={handleModeChange}
                    >
                      <MenuItem value="Car">Car</MenuItem>
                      <MenuItem value="bus">Bus</MenuItem>
                      <MenuItem value="train">Train</MenuItem>
                      <MenuItem value="walking">Walking</MenuItem>
                      <MenuItem value="bicycling">Bicycling</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    onClick={handleSubmit}
                    sx={{ minWidth: "230px" }}
                    component="label"
                    variant="contained"
                    endIcon={<SendIcon />}
                  >
                    Send
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8} lg={9}>
          <Card sx={{ height: "100%", boxShadow: "none" }}>
            <CardContent></CardContent>
          </Card>
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default MyForm;




