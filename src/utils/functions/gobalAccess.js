const gobalAccess = async (resource = 'categories', method = 'find', other = {}) => {
    try {
        let Database;
        try {
            Database = require(`../../database/models/${resource}`);
        } catch (error) {
            return { status: false, msg: 'Resource not found', error };
        }

        let data;

        if (method === 'create') {
            data = await Database.create(other);
        } else if (method === 'update') {
            data = await Database.findOneAndUpdate({}, { $set: other }, { new: true, useFindAndModify: false });
        } else if (method === 'updateAll') {
            data = await Database.updateMany({}, { $set: other }, { new: true, useFindAndModify: false });
        } else {
            data = await Database.find(other);
        }

        return { status: true, msg: 'Operation successful', data };
    } catch (error) {
        return { status: false, msg: 'Something went wrong, please try again', error };
    }
};

module.exports = gobalAccess;
