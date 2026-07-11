BCS.Formatter = {

    number(value){

        return new Intl.NumberFormat(
            "id-ID",
            {
                minimumFractionDigits:2,
                maximumFractionDigits:2
            }
        ).format(value);

    },

    currency(value){

        return new Intl.NumberFormat(
            "id-ID",
            {
                style:"currency",
                currency:"IDR",
                minimumFractionDigits:0
            }
        ).format(value);

    },

    percent(value){

        return value.toFixed(2)+"%";

    }

};
