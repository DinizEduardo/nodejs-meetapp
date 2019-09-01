import Sequelize, { Model } from 'sequelize';

class Meetup extends Model {
  static init(sequelize) {
    super.init(
      {
        title: Sequelize.STRING,
        description: Sequelize.STRING,
        location: Sequelize.STRING,
        date: Sequelize.DATE,
      },
      {
        sequelize,
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.File, { foreignKey: 'id_file' });
    this.belongsTo(models.User, { foreignKey: 'id_user' });
    this.hasMany(models.Subscription, { foreignKey: 'id_meetup'});
  }
}

export default Meetup;
