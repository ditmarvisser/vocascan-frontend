import React, { useCallback, useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import Button from "../../Components/Button/Button.jsx";
import ArrayTextInput from "../../Components/Form/ArrayTextInput/ArrayTextInput.jsx";
import Select, {
  CustomPackageSelectOption,
} from "../../Components/Form/Select/Select.jsx";
import Switch from "../../Components/Form/Switch/Switch.jsx";
import TextInput from "../../Components/Form/TextInput/TextInput.jsx";
import Modal from "../../Components/Modal/Modal.jsx";
import GroupForm from "../../Forms/GroupForm/GroupForm.jsx";
import PackageForm from "../../Forms/PackageForm/PackageForm.jsx";
import SnackbarContext from "../../context/SnackbarContext.jsx";

import { setVocabActive, setVocabActivate } from "../../redux/Actions/form.js";
import { getPackages, createVocabulary } from "../../utils/api.js";
import { languages, maxTranslations } from "../../utils/constants.js";

const VocabForm = ({
  defaultData = null,
  onSubmitCallback = null,
  title = null,
}) => {
  const { t } = useTranslation();

  const { showSnack } = useContext(SnackbarContext);
  const dispatch = useDispatch();

  const active = useSelector((state) => state.form.vocab.active);
  const activate = useSelector((state) => state.form.vocab.activate);

  const [packages, setPackages] = useState([]);
  const [packageItems, setPackageItems] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [groups, setGroups] = useState([]);
  const [groupsItems, setGroupsItems] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [foreignWord, setForeignWord] = useState(
    defaultData ? defaultData.name : ""
  );
  const [translations, setTranslations] = useState(
    defaultData ? defaultData.Translations.map((ele) => ele.name) : ""
  );
  const [description, setDescription] = useState(
    defaultData ? defaultData.description : ""
  );

  const [showAddPackage, setShowAddPackage] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);

  const onChangeActive = useCallback(() => {
    dispatch(setVocabActive({ active: !active }));
  }, [dispatch, active]);

  const onChangeActivate = useCallback(() => {
    dispatch(setVocabActivate({ activate: !activate }));
  }, [dispatch, activate]);

  const fetchPackages = useCallback(() => {
    getPackages(true)
      .then(({ data }) => {
        setPackages(data);
      })
      .catch((err) => {
        showSnack("error", t("global.fetchError"));
      });
  }, [showSnack, t]);

  const onClear = useCallback(() => {
    setForeignWord("");
    setDescription("");
    setTranslations(null);
  }, [setForeignWord, setTranslations]);

  const openPackageModal = useCallback(() => {
    setShowAddPackage(true);
  }, []);

  const openGroupModal = useCallback(() => {
    setShowAddGroup(true);
  }, []);

  const closePackageModal = useCallback(() => {
    setShowAddPackage(false);
  }, []);

  const closeGroupModal = useCallback(() => {
    setShowAddGroup(false);
  }, []);

  const packageAdded = useCallback(
    (newPackage) => {
      setSelectedPackage({ value: newPackage.id, label: newPackage.name });
      closePackageModal();
      fetchPackages();
    },
    [closePackageModal, fetchPackages]
  );

  const groupAdded = useCallback(
    (newGroup) => {
      closeGroupModal();
      fetchPackages();
      setSelectedGroup({ value: newGroup.id, label: newGroup.name });
    },
    [closeGroupModal, fetchPackages]
  );

  const onSubmit = useCallback(() => {
    const submitTranslations = translations.map((elem) => {
      return {
        name: elem,
      };
    });

    createVocabulary(
      selectedPackage.value,
      selectedGroup.value,
      {
        name: foreignWord,
        translations: submitTranslations,
        active,
        description,
      },
      activate
    )
      .then((response) => {
        onClear();
        showSnack("success", t("screens.addVocab.saveSuccessMessage"));
        onSubmitCallback && onSubmitCallback();
      })
      .catch((e) => {
        showSnack("error", t("screens.addVocab.saveErrorMessage"));
      });
  }, [
    activate,
    active,
    description,
    onSubmitCallback,
    selectedGroup,
    selectedPackage,
    foreignWord,
    translations,
    onClear,
    showSnack,
    t,
  ]);

  useEffect(() => {
    if (defaultData) {
      dispatch(setVocabActive({ active: defaultData.active }));
      dispatch(setVocabActivate({ activate: defaultData.activate }));
    }
  }, [defaultData, dispatch]);

  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedPackage) {
      return;
    }

    const grps = packages.find((p) => p.id === selectedPackage.value);

    setGroups(() => {
      if (!grps) {
        return [];
      }

      return grps.Groups;
    });

    setSelectedGroup((grp) => {
      if (!grp || !grps) {
        return null;
      }

      const contain = grps.Groups.find((g) => g.id === grp.value);

      if (!contain) {
        return null;
      }

      return grp;
    });
  }, [packages, selectedPackage]);

  useEffect(() => {
    setPackageItems(() =>
      packages.map((p) => {
        const foreignIcon = languages.find(
          (x) => x.name === p.foreignWordLanguage
        ).icon;
        const translatedIcon = languages.find(
          (x) => x.name === p.translatedWordLanguage
        ).icon;

        return {
          value: p.id,
          label: (
            <CustomPackageSelectOption
              name={p.name}
              postfix={foreignIcon + " - " + translatedIcon}
            />
          ),
        };
      })
    );
  }, [packages]);

  useEffect(() => {
    setGroupsItems(() =>
      groups.map((g) => {
        return {
          value: g.id,
          label: g.name,
        };
      })
    );
  }, [groups]);

  return (
    <>
      {title && <h1 className="heading">{title}</h1>}

      <div className="dropdowns">
        <div className="select-wrapper">
          <Select
            required
            creatable
            createText={"Create new Package"}
            onCreate={openPackageModal}
            tabIndex={1}
            label={t("global.package")}
            options={packageItems}
            onChange={(v) => {
              setSelectedPackage(v);
            }}
            value={selectedPackage}
            noOptionsMessage={t("screens.addVocab.noPackagesMessage")}
          />
        </div>
        <div className="select-wrapper">
          <Select
            required
            creatable
            createText={"Create new Group"}
            onCreate={openGroupModal}
            disabled={!selectedPackage}
            tabIndex={1}
            label={t("global.group")}
            options={groupsItems}
            onChange={(v) => {
              setSelectedGroup(v);
            }}
            value={selectedGroup}
            noOptionsMessage={t("screens.addVocab.noGroupsMessage")}
          />
        </div>
      </div>
      <div className="input-fields">
        <TextInput
          required
          tabIndex={1}
          placeholder={t("global.foreignWord")}
          onChange={(value) => {
            setForeignWord(value);
          }}
          value={foreignWord}
        />
        <ArrayTextInput
          required
          max={maxTranslations}
          data={translations}
          placeholder={t("global.translation")}
          onChange={setTranslations}
          addText={t("screens.addVocab.addTranslation")}
        />
        <TextInput
          tabIndex={1}
          placeholder={t("global.description")}
          onChange={(value) => {
            setDescription(value);
          }}
          value={description}
        />
        <Switch
          appearance="on-off"
          optionLeft={t("screens.addVocab.activeLabel")}
          infoLeft="Test information"
          onChange={onChangeActive}
          checked={active}
        />
        <Switch
          appearance="on-off"
          optionLeft={t("screens.addVocab.activateLabel")}
          infoLeft="Test information w"
          onChange={onChangeActivate}
          checked={activate}
        />
      </div>

      <div className="form-submit">
        <Button
          block
          tabIndex={-1}
          onClick={onSubmit}
          disabled={
            !(
              foreignWord &&
              translations?.length &&
              selectedGroup &&
              selectedPackage
            )
          }
        >
          {t("global.add")}
        </Button>
      </div>
      <Modal
        title={"Add Package"}
        open={showAddPackage}
        onClose={closePackageModal}
      >
        <PackageForm onSubmitCallback={packageAdded} />
      </Modal>
      <Modal title={"Add Group"} open={showAddGroup} onClose={closeGroupModal}>
        <GroupForm
          fixedPackage
          selectedPackage={selectedPackage}
          onSubmitCallback={groupAdded}
        />
      </Modal>
    </>
  );
};

export default VocabForm;
