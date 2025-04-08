import * as mongoose from 'mongoose';

async function main() {
  await mongoose.connect('mongodb://172.104.52.10:27017/', {
    auth: { username: 'root', password: 'example' },
    dbName: 'enigma-sento',
  });
  const imageSchema = new mongoose.Schema({
    people: { type: [mongoose.Types.ObjectId] },
  });

  const imageModel = mongoose.model('images', imageSchema);
  const updatePayload = (await imageModel.find({}).lean()).map((doc) => ({
    _id: doc._id,
    people: doc.people || [],
  }));
  await Promise.all(
    updatePayload.map(async (item) => {
      await imageModel.updateOne(
        { _id: item._id },
        { $set: { people: [...item.people] } },
      );
    }),
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => console.log(err));
