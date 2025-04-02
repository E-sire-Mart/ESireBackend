import mongoose from "mongoose";

const PremiumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0.0,
        },
        product_umber: {
            type: Number,
            default: 0
        },
        transaction_fee: {
            type: Number,
            default: 5.0
        },
        marketingAndPromotion: {
            type: String,
            default: "limite"
        },
        supportType: {
            type: String,
            default: "Email"
        },
        AdvancedAnalytics: {
            type: String,
            enum: ["Basic", "DetailedInSight", "AIDriven"],
            default: "Basic"
        },
        CustomBranding: {
            type: Boolean,
            default: false
        }
  },
  {
    timestamps: true,
  }
);

const PremiumModel = mongoose.model("premium", categorySchema);

export default PremiumSchema;
