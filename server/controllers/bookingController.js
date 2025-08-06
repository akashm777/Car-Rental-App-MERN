import Booking from "../models/Booking.js"
import Car from "../models/Car.js";

// Function to check availability of car for a given date
export const checkAvailability = async (car, pickupDate, returnDate)=>{
    const bookings = await Booking.find({
        car, 
        pickupDate: {$lte: returnDate},
        returnDate: {$gte: pickupDate}
    })

    return bookings.length === 0;
}


// API to check availability of cars for a given date and location
export const checkAvailabilityOfCar = async (req, res)=>{
    try{
        const {location, pickupDate, returnDate} = req.body;

        // Validate date range
        const pickup = new Date(pickupDate);
        const return_date = new Date(returnDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if pickup date is in the past
        if (pickup < today) {
            return res.json({
                success: false,
                message: "Pickup date cannot be in the past"
            });
        }

        // Check if return date is before pickup date
        if (return_date <= pickup) {
            return res.json({
                success: false,
                message: "Return date must be after pickup date"
            });
        }

        // Check if booking is for more than 30 days
        const daysDiff = Math.ceil((return_date - pickup) / (1000 * 60 * 60 * 24));
        if (daysDiff > 30) {
            return res.json({
                success: false,
                message: "Booking cannot exceed 30 days"
            });
        }

        // fetch all available cars for the given location
        const cars = await Car.find({location, isAvailable: true})

        // check car availability for the given data range using promise
        const availableCarsPromises = cars.map(async (car)=>{
            const isAvailable = await checkAvailability(car._id, pickupDate, returnDate);
            return {...car._doc, isAvailable: isAvailable}
        })

        let availableCars = await Promise.all(availableCarsPromises);
        availableCars = availableCars.filter(car => car.isAvailable === true);

        res.json({
            success : true,
            availableCars
        })
    }
    catch(e){
        console.error(e.message);
        return res.json({
            success : false,
            message : e.message
        })
    }
}


// API to create booking
export const createBooking = async (req, res)=>{
    try{
        const {_id} = req.user;
        const {car, pickupDate, returnDate} = req.body;

        // Validate date range
        const pickup = new Date(pickupDate);
        const return_date = new Date(returnDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if pickup date is in the past
        if (pickup < today) {
            return res.json({
                success: false,
                message: "Pickup date cannot be in the past"
            });
        }

        // Check if return date is before pickup date
        if (return_date <= pickup) {
            return res.json({
                success: false,
                message: "Return date must be after pickup date"
            });
        }

        // Check if booking is for more than 30 days
        const daysDiff = Math.ceil((return_date - pickup) / (1000 * 60 * 60 * 24));
        if (daysDiff > 30) {
            return res.json({
                success: false,
                message: "Booking cannot exceed 30 days"
            });
        }

        const isAvailable = await checkAvailability(car, pickupDate, returnDate);
        if(!isAvailable){
            return res.json({
                success : false,
                message : "Car is not Available"
            })
        }

        const carData = await Car.findById(car);

        // Calculate price based on pickupDate and returnDate
        const picked = new Date(pickupDate);
        const returned = new Date(returnDate);
        const noOfDays = Math.ceil((returned - picked) / (1000 * 60 * 60 * 24));
        const price = carData.pricePerDay * noOfDays;

        await Booking.create({
            car,
            owner: carData.owner,
            user: _id,
            pickupDate,
            returnDate,
            price
        });

        res.json({
            success : true,
            message : "Booking Created"
        })

    }
    catch(e){
        console.error(e.message);
        return res.json({
            success : false,
            message : e.message
        })
    }
}


// API to List user bookings
export const getUserBookings = async (req, res) => {
  try {
    const { _id } = req.user;
    const bookings = await Booking.find({ user: _id }).populate("car").sort({ createdAt: -1 });

    return res.json({ 
        success: true, 
        bookings 
    });

  } 
  catch (error) {
    console.error(error.message);
    return res.json({ success: false, message: error.message });
  }
}


// API to get owner bookings
export const getOwnerBookings = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.json({
        success: false,
        message: "Unauthorized"
      });
    }

    const bookings = await Booking.find({ owner: req.user._id })
      .populate("car user").select("-user.password").sort({ createdAt: -1 });

    return res.json({ success: true, bookings });

  } catch (error) {
    console.error(error.message);
    return res.json({ success: false, message: error.message });
  }
};


// API to change booking status
export const changeBookingStatus = async (req, res) => {
    try {
        const { _id } = req.user;
        const { bookingId, status } = req.body;

        const booking = await Booking.findById(bookingId);

        if (booking.owner.toString() !== _id.toString()) {
            return res.json({
                success: false,
                message: "Unauthorized"
            });
        }

        booking.status = status;
        await booking.save();

        return res.json({ success: true, message: "Status Updated" });
    }
    catch(e){
        console.error(e.message);
        return res.json({ success: false, message: e.message });
    }
}
