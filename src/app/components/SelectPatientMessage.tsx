import Image from "next/image";

const SelectPatientMessage = () => {
  return (
    <div className="w-full px-8 py-10 md:py-20 rounded-2xl border text-zinc-800 border-white/10 shadow-2xl">
      {/* Glassmorphism overlay */}
      {/* <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-2xl" /> */}

      <div className="w-full flex md:hidden justify-center">
        <Image
          src="/PatientSelection.png"
          alt="PatientSelection"
          width={150}
          height={150}
        />
      </div>
      <div className="w-full hidden md:flex justify-center">
        <Image
          src="/PatientSelection.png"
          alt="PatientSelection"
          width={250}
          height={250}
        />
      </div>
      <div className="text-center space-y-4">
        <h2 className="text-lg md:text-2xl font-bold text-black">
          Patient Selection Required
        </h2>
        <p className="text-zinc-800 text-sm md:text-base font-medium leading-relaxed">
          Search a patient record from the directory to access health profiles
        </p>
      </div>
    </div>
  );
};

export default SelectPatientMessage;
