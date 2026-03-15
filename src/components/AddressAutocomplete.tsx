import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface AddressResult {
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  defaultValue?: string;
  onSelect: (result: AddressResult) => void;
}

export function AddressAutocomplete({
  defaultValue = "",
  onSelect,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || autocompleteRef.current) return;

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["address_components", "geometry"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.geometry?.location || !place.address_components) return;

      const get = (type: string) =>
        place.address_components?.find(
          (c: google.maps.GeocoderAddressComponent) => c.types.includes(type)
        )?.short_name ?? "";

      const streetNumber = get("street_number");
      const route = get("route");

      onSelect({
        address: [streetNumber, route].filter(Boolean).join(" "),
        city: get("locality") || get("sublocality"),
        state: get("administrative_area_level_1"),
        zip: get("postal_code"),
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      });
    });

    autocompleteRef.current = ac;
  }, [onSelect]);

  return (
    <Input
      ref={inputRef}
      defaultValue={defaultValue}
      placeholder="Start typing an address..."
    />
  );
}
