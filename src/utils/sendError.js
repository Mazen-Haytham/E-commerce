export const sendError = (err, req, res, next) => {
    if (err.isOperational) {
        return res.status(err.statusCode).send({
            status: err.status,
            message: err.message,
            errors: err.errors,
        });
    }
    return res.status(500).send({
        status: "Fail",
        message: "Something Went Wrong",
    });
};
