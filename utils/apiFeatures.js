class APIFeature {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        // BUILD THE QUERY
        const queryObj = { ...this.queryString };

        // Features to be implemented on API like pagination, sorting ...
        const excludedeFields = ["page", "sort", "limit", "fields"];

        excludedeFields.forEach((el) => delete queryObj[el]);

        let queryString = JSON.stringify(queryObj);

        queryString = queryString.replace(
            /\b(lte|lt|gte|gt)\b/g,
            (match) => `$${match}`
        );

        this.query = this.query.find(JSON.parse(queryString));

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(",").join(" ");
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort("-ratingsAverage");
        }

        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fieldsToDisplay = this.queryString.fields
                .split(",")
                .join(" ");
            this.query = this.query.select(fieldsToDisplay);
        } else {
            this.query = this.query.select("-__v");
        }

        return this;
    }

    pagination() {
        const page = +this.queryString.page || 1;
        const limit = +this.queryString.limit || 10;
        const skip = (page - 1) * limit;

        // page=2&limit=5 => skip 5 results
        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeature;
