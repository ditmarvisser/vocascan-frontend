import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import Button from "../../Components/Button/Button.jsx";
import Select from "../../Components/Form/Select/Select.jsx";
import Switch from "../../Components/Form/Switch/Switch.jsx";
import TextInput from "../../Components/Form/TextInput/TextInput.jsx";

import useSnack from "../../hooks/useSnack.js";
import { setGroupActive } from "../../redux/Actions/form.js";
import { getPackages, createGroup, modifyGroup } from "../../utils/api.js";
import { languages } from "../../utils/constants.js";

import "./GroupForm.scss";

const GroupForm = ({
  fixedPackage = false,
  defaultData = null,
  selectedPackage = null,
  onSubmitCallback = null,
}) => {
  const { t } = useTranslation();
  const { showSnack } = useSnack();
  const dispatch = useDispatch();
  const active = useSelector((state) => state.form.group.active);

  const [localActive, setLocalActive] = useState(
    defaultData ? defaultData.active : active
  );

  const [name, setName] = useState(defaultData ? defaultData.name : "");
  const [languagePackage, setLanguagePackage] = useState(selectedPackage);
  const [canSubmit, setCanSubmit] = useState(false);
  const [languagePackages, setLanguagePackages] = useState([]);
  const [packageItems, setPackageItems] = useState([]);

  const fetchPackages = useCallback(() => {
    getPackages(true)
      .then(({ data }) => {
        setLanguagePackages(data);
      })
      .catch((err) => {
        showSnack("error", t("global.fetchError"));
      });
  }, [showSnack, t]);

  const submitHandler = useCallback(async () => {
    const newGroup = {
      name,
      active: localActive,
    };

    if (defaultData?.id) {
      newGroup.id = defaultData.id;

      modifyGroup(newGroup)
        .then(({ data }) => {
          onSubmitCallback && onSubmitCallback(data);
          showSnack(
            "success",
            t("components.groupForm.modifyGroupSuccessMessage")
          );
        })
        .catch((error) => {
          if (error.response.status === 401) {
            console.log("jwt expired");
            showSnack(
              "error",
              t("components.groupForm.modifyGroupFailMessage")
            );
          }
        });

      return;
    }
    createGroup(languagePackage.id || languagePackage.value, newGroup)
      .then(({ data }) => {
        onSubmitCallback && onSubmitCallback(data);
        dispatch(setGroupActive({ active: localActive }));
        showSnack("success", t("components.groupForm.saveGroupSuccessMessage"));
      })
      .catch((error) => {
        if (error.response.status === 401) {
          console.log("jwt expired");
          showSnack("error", t("components.groupForm.saveGroupFailMessage"));
        }
      });
  }, [
    defaultData?.id,
    dispatch,
    languagePackage?.id,
    languagePackage?.value,
    localActive,
    name,
    onSubmitCallback,
    showSnack,
    t,
  ]);

  const onChangeActive = useCallback(() => {
    setLocalActive((act) => !act);
  }, []);

  useEffect(() => {
    setCanSubmit(!(!name || !languagePackage));
  }, [languagePackage, name]);

  useEffect(() => {
    if (fixedPackage) {
      return;
    }

    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPackageItems(() =>
      languagePackages.map((p) => {
        const langs = p.name.split(" - ").map((e) => {
          const icon = languages.find((x) => x.name === e);
          return icon ? icon.icon + e : " " + e;
        });

        return {
          value: p.id,
          label: langs.join(" - "),
        };
      })
    );
  }, [languagePackages]);

  return (
    <div className="group-form">
      <div className="form-wrapper">
        <div className="dropdown">
          <div className="select-wrapper">
            <Select
              disabled={fixedPackage}
              required
              label={t("components.groupForm.languagePackage")}
              options={packageItems}
              onChange={(value) => {
                setLanguagePackage(value);
              }}
              value={languagePackage}
            />
          </div>
        </div>

        <TextInput
          required
          placeholder={t("global.name")}
          onChange={(value) => {
            setName(value);
          }}
          value={name}
        />
        <Switch
          appearance="on-off"
          optionLeft={t("components.groupForm.activeLabel")}
          onChange={onChangeActive}
          checked={localActive}
        />
      </div>

      <Button disabled={!canSubmit} onClick={submitHandler}>
        {t("global.submit")}
      </Button>
    </div>
  );
};

export default GroupForm;